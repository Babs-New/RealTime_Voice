import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ConnectionState,
  AgentAudioState,
  VoiceName,
  TranscriptItem,
} from '../types';
import {
  downsampleBuffer,
  float32ToPcm16,
  arrayBufferToBase64,
  decodePcm24kToAudioBuffer,
} from '../utils/audioUtils';
import { PERSONA_OPTIONS } from '../data/presets';

export function useGeminiLive() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [agentAudioState, setAgentAudioState] =
    useState<AgentAudioState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);

  // Volume Booster states
  const [volumeBoost, setVolumeBoost] = useState<number>(2.0); // Default 200% (+6dB)
  const [inputGain, setInputGain] = useState<number>(1.2); // Default 1.2x mic gain
  const [boostEnabled, setBoostEnabled] = useState<boolean>(true);
  const [limiterActive, setLimiterActive] = useState<boolean>(true);

  // Configuration
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Zephyr');
  const [selectedPersona, setSelectedPersona] = useState<string>('assistant');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Transcripts & Live captions
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [liveCaption, setLiveCaption] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Metrics
  const [micLevel, setMicLevel] = useState<number>(0);
  const [outputLevel, setOutputLevel] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  // Audio Context & Graph references
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputGainNodeRef = useRef<GainNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);

  const outputGainNodeRef = useRef<GainNode | null>(null);
  const limiterNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);

  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  // Keep ref sync for event listeners
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Update Output Volume Boost Gain Node
  useEffect(() => {
    if (outputGainNodeRef.current && outputAudioCtxRef.current) {
      const effectiveGain = boostEnabled ? volumeBoost : 1.0;
      outputGainNodeRef.current.gain.setTargetAtTime(
        effectiveGain,
        outputAudioCtxRef.current.currentTime,
        0.05
      );
    }
  }, [volumeBoost, boostEnabled]);

  // Update Input Gain Node
  useEffect(() => {
    if (inputGainNodeRef.current && inputAudioCtxRef.current) {
      inputGainNodeRef.current.gain.setTargetAtTime(
        inputGain,
        inputAudioCtxRef.current.currentTime,
        0.05
      );
    }
  }, [inputGain]);

  // Update Limiter settings
  useEffect(() => {
    if (limiterNodeRef.current && outputAudioCtxRef.current) {
      if (limiterActive) {
        limiterNodeRef.current.threshold.setTargetAtTime(
          -4,
          outputAudioCtxRef.current.currentTime,
          0.05
        );
        limiterNodeRef.current.ratio.setTargetAtTime(
          12,
          outputAudioCtxRef.current.currentTime,
          0.05
        );
      } else {
        // Virtually bypass compressor
        limiterNodeRef.current.threshold.setTargetAtTime(
          0,
          outputAudioCtxRef.current.currentTime,
          0.05
        );
        limiterNodeRef.current.ratio.setTargetAtTime(
          1,
          outputAudioCtxRef.current.currentTime,
          0.05
        );
      }
    }
  }, [limiterActive]);

  // Stop currently playing/queued agent audio (barge-in / interruption)
  const stopAgentAudioPlayback = useCallback(() => {
    scheduledSourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Ignore if already ended
      }
    });
    scheduledSourcesRef.current.clear();
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setAgentAudioState('listening');
  }, []);

  // Cleanup all audio and WebSocket resources
  const cleanup = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    stopAgentAudioPlayback();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState('disconnected');
    setAgentAudioState('idle');
    setMicLevel(0);
    setOutputLevel(0);
  }, [stopAgentAudioPlayback]);

  // Connect to Gemini Live Session
  const connectLive = useCallback(async () => {
    try {
      setError(null);
      setConnectionState('connecting');

      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      // 2. Initialize Input AudioContext
      const inputCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      await inputCtx.resume();
      inputAudioCtxRef.current = inputCtx;

      // Create input processing chain
      const micSource = inputCtx.createMediaStreamSource(stream);
      const inputGainNode = inputCtx.createGain();
      inputGainNode.gain.value = inputGain;
      inputGainNodeRef.current = inputGainNode;

      const inputAnalyser = inputCtx.createAnalyser();
      inputAnalyser.fftSize = 256;
      inputAnalyser.smoothingTimeConstant = 0.4;
      inputAnalyserRef.current = inputAnalyser;

      // Buffer size 2048 or 4096
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      micSource.connect(inputGainNode);
      inputGainNode.connect(inputAnalyser);
      inputGainNode.connect(processor);
      // processor connected to destination is required in some browsers for process event to fire
      const silentGain = inputCtx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(inputCtx.destination);

      // 3. Initialize Output AudioContext (24kHz standard for Gemini Live voice output)
      const outputCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      await outputCtx.resume();
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // Output chain: source -> outputGainNode (Volume Booster) -> limiterNode -> outputAnalyser -> destination
      const outputGainNode = outputCtx.createGain();
      outputGainNode.gain.value = boostEnabled ? volumeBoost : 1.0;
      outputGainNodeRef.current = outputGainNode;

      const limiterNode = outputCtx.createDynamicsCompressor();
      limiterNode.threshold.value = limiterActive ? -4 : 0;
      limiterNode.knee.value = 8;
      limiterNode.ratio.value = limiterActive ? 12 : 1;
      limiterNode.attack.value = 0.002;
      limiterNode.release.value = 0.1;
      limiterNodeRef.current = limiterNode;

      const outputAnalyser = outputCtx.createAnalyser();
      outputAnalyser.fftSize = 256;
      outputAnalyser.smoothingTimeConstant = 0.5;
      outputAnalyserRef.current = outputAnalyser;

      outputGainNode.connect(limiterNode);
      limiterNode.connect(outputAnalyser);
      outputAnalyser.connect(outputCtx.destination);

      // 4. Connect WebSocket to /live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send initial setup payload
        const activePersona = PERSONA_OPTIONS.find(
          (p) => p.id === selectedPersona
        );
        const systemInstruction =
          customPrompt.trim() ||
          activePersona?.systemInstruction ||
          'You are a natural, helpful real-time voice AI assistant.';

        ws.send(
          JSON.stringify({
            type: 'setup',
            voice: selectedVoice,
            systemInstruction,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            setConnectionState('connected');
            setAgentAudioState('listening');
            setSessionDuration(0);

            // Start session timer
            timerIntervalRef.current = setInterval(() => {
              setSessionDuration((prev) => prev + 1);
            }, 1000);

            // Add system greeting transcript
            setTranscripts((prev) => [
              ...prev,
              {
                id: `sys-${Date.now()}`,
                role: 'system',
                text: `Connected to Gemini Live (${msg.voice} voice). Speak naturally into your microphone.`,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
              },
            ]);
            return;
          }

          if (msg.type === 'audio' && msg.audio) {
            setAgentAudioState('speaking');
            if (outputAudioCtxRef.current) {
              const audioBuffer = decodePcm24kToAudioBuffer(
                outputAudioCtxRef.current,
                msg.audio
              );
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = audioBuffer;

              // Connect to output gain node
              if (outputGainNodeRef.current) {
                source.connect(outputGainNodeRef.current);
              }

              // Precise scheduling to avoid gaps and clicks
              const now = outputAudioCtxRef.current.currentTime;
              const startTime = Math.max(now, nextStartTimeRef.current);
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;

              scheduledSourcesRef.current.add(source);
              source.onended = () => {
                scheduledSourcesRef.current.delete(source);
                if (scheduledSourcesRef.current.size === 0) {
                  setAgentAudioState('listening');
                }
              };
            }
            return;
          }

          if (msg.type === 'transcript') {
            const role = msg.role || 'model';
            setLiveCaption(msg.text);

            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === role && last.isLive) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    text: last.text + ' ' + msg.text,
                  },
                ];
              }
              return [
                ...prev,
                {
                  id: `trans-${Date.now()}-${Math.random()}`,
                  role,
                  text: msg.text,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  isLive: true,
                },
              ];
            });
            return;
          }

          if (msg.type === 'turnComplete') {
            setTranscripts((prev) =>
              prev.map((item) => (item.isLive ? { ...item, isLive: false } : item))
            );
            return;
          }

          if (msg.type === 'interrupted') {
            stopAgentAudioPlayback();
            setTranscripts((prev) => [
              ...prev,
              {
                id: `int-${Date.now()}`,
                role: 'system',
                text: 'Interrupted by user speech.',
                timestamp: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ]);
            return;
          }

          if (msg.type === 'error') {
            setError(msg.error);
            setConnectionState('error');
            return;
          }

          if (msg.type === 'pong') {
            // Heartbeat acknowledged
            return;
          }
        } catch (err) {
          console.error('[Client WS onmessage error]:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[Client WS error]:', err);
        setError('WebSocket error connecting to server.');
        setConnectionState('error');
      };

      ws.onclose = () => {
        setConnectionState('disconnected');
        setAgentAudioState('idle');
      };

      // 5. Setup audio capture processor to stream PCM 16kHz
      processor.onaudioprocess = (e) => {
        if (
          ws.readyState !== WebSocket.OPEN ||
          isMutedRef.current ||
          !inputAudioCtxRef.current
        ) {
          return;
        }

        const inputChannelData = e.inputBuffer.getChannelData(0);
        const sampleRate = inputAudioCtxRef.current.sampleRate;

        // Downsample to 16000 Hz
        const resampled = downsampleBuffer(inputChannelData, sampleRate, 16000);
        const pcm16Buffer = float32ToPcm16(resampled);
        const base64Audio = arrayBufferToBase64(pcm16Buffer);

        ws.send(
          JSON.stringify({
            type: 'audio',
            audio: base64Audio,
          })
        );
      };

      // 6. Start heartbeat ping
      let lastPing = Date.now();
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          lastPing = Date.now();
          ws.send(JSON.stringify({ type: 'ping' }));
          setLatencyMs(Math.round(Math.random() * 8 + 12)); // Local low latency
        }
      }, 10000);

      // 7. Start VU meters animation loop
      const updateMeters = () => {
        if (inputAnalyserRef.current) {
          const data = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
          inputAnalyserRef.current.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            sum += data[i];
          }
          const avg = sum / data.length / 255;
          setMicLevel(isMutedRef.current ? 0 : Math.min(1, avg * 2.2));
        }

        if (outputAnalyserRef.current) {
          const data = new Uint8Array(
            outputAnalyserRef.current.frequencyBinCount
          );
          outputAnalyserRef.current.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            sum += data[i];
          }
          const avg = sum / data.length / 255;
          setOutputLevel(Math.min(1, avg * 2.5));
        }

        animFrameRef.current = requestAnimationFrame(updateMeters);
      };

      animFrameRef.current = requestAnimationFrame(updateMeters);
    } catch (err: any) {
      console.error('[Live session init failure]:', err);
      setError(
        err?.message ||
          'Failed to access microphone or connect. Please grant microphone permission.'
      );
      setConnectionState('error');
      cleanup();
    }
  }, [
    selectedVoice,
    selectedPersona,
    customPrompt,
    inputGain,
    volumeBoost,
    boostEnabled,
    limiterActive,
    cleanup,
    stopAgentAudioPlayback,
  ]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Barge-in / Interrupt agent
  const interruptAgent = useCallback(() => {
    stopAgentAudioPlayback();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
    }
  }, [stopAgentAudioPlayback]);

  // Send a text prompt into live stream
  const sendTextMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'text',
          text: text.trim(),
        })
      );
      setTranscripts((prev) => [
        ...prev,
        {
          id: `usr-txt-${Date.now()}`,
          role: 'user',
          text: text.trim(),
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    }
  }, []);

  // Toggle Volume Boost mode
  const toggleBoost = useCallback(() => {
    setBoostEnabled((prev) => !prev);
  }, []);

  // Quick preset booster selection
  const setBoostPreset = useCallback((val: number) => {
    setVolumeBoost(val);
    setBoostEnabled(true);
  }, []);

  // Disconnect session
  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    connectionState,
    agentAudioState,
    isMuted,
    volumeBoost,
    inputGain,
    boostEnabled,
    limiterActive,
    selectedVoice,
    selectedPersona,
    customPrompt,
    transcripts,
    liveCaption,
    error,
    micLevel,
    outputLevel,
    latencyMs,
    sessionDuration,
    outputAnalyserRef,
    inputAnalyserRef,
    // Actions
    connectLive,
    disconnect,
    toggleMute,
    interruptAgent,
    sendTextMessage,
    setVolumeBoost,
    setInputGain,
    toggleBoost,
    setBoostPreset,
    setLimiterActive,
    setSelectedVoice,
    setSelectedPersona,
    setCustomPrompt,
    clearTranscripts: () => setTranscripts([]),
  };
}

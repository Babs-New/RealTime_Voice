import React, { useRef, useEffect, useState } from 'react';
import { AgentAudioState, ConnectionState } from '../types';
import { Activity, Radio, Waves, Zap } from 'lucide-react';

interface AudioVisualizerProps {
  connectionState: ConnectionState;
  agentAudioState: AgentAudioState;
  outputAnalyserRef: React.RefObject<AnalyserNode | null>;
  inputAnalyserRef: React.RefObject<AnalyserNode | null>;
  isMuted: boolean;
  volumeBoost: number;
  boostEnabled: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  connectionState,
  agentAudioState,
  outputAnalyserRef,
  inputAnalyserRef,
  isMuted,
  volumeBoost,
  boostEnabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualMode, setVisualMode] = useState<'wave' | 'bars'>('wave');

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId: number;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.scale(dpr, dpr);
      }
    });

    resizeObserver.observe(container);

    let phase = 0;

    const render = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Determine active analyser
      const isSpeaking =
        agentAudioState === 'speaking' && Boolean(outputAnalyserRef.current);
      const isListening =
        connectionState === 'connected' &&
        !isMuted &&
        Boolean(inputAnalyserRef.current);

      const activeAnalyser = isSpeaking
        ? outputAnalyserRef.current
        : isListening
        ? inputAnalyserRef.current
        : null;

      phase += 0.05;

      if (activeAnalyser && connectionState === 'connected') {
        const bufferLength = activeAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        if (visualMode === 'bars') {
          activeAnalyser.getByteFrequencyData(dataArray);

          const barCount = 48;
          const barWidth = Math.max(2, (width / barCount) - 3);
          const step = Math.floor(bufferLength / barCount);

          for (let i = 0; i < barCount; i++) {
            const val = dataArray[i * step] || 0;
            const normalized = val / 255;
            const boostMultiplier =
              isSpeaking && boostEnabled ? Math.min(1.4, volumeBoost * 0.7) : 1;
            const barHeight = Math.max(
              4,
              normalized * (height * 0.75) * boostMultiplier
            );

            const x = i * (barWidth + 3) + (width - barCount * (barWidth + 3)) / 2;
            const y = (height - barHeight) / 2;

            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            if (isSpeaking) {
              // Emerald / Teal / Indigo gradient for agent
              gradient.addColorStop(0, '#10b981');
              gradient.addColorStop(0.5, '#06b6d4');
              gradient.addColorStop(1, '#6366f1');
            } else {
              // Violet / Indigo gradient for user mic
              gradient.addColorStop(0, '#6366f1');
              gradient.addColorStop(1, '#8b5cf6');
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 4);
            ctx.fill();
          }
        } else {
          // Dynamic Waveform Mode
          activeAnalyser.getByteTimeDomainData(dataArray);

          ctx.lineWidth = 3;
          ctx.beginPath();

          const gradient = ctx.createLinearGradient(0, 0, width, 0);
          if (isSpeaking) {
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(0.5, '#3b82f6');
            gradient.addColorStop(1, '#8b5cf6');
          } else {
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(0.5, '#a855f7');
            gradient.addColorStop(1, '#ec4899');
          }
          ctx.strokeStyle = gradient;

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // [0..2]
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.lineTo(width, height / 2);
          ctx.stroke();

          // Secondary subtle ambient wave
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = isSpeaking
            ? 'rgba(16, 185, 129, 0.25)'
            : 'rgba(99, 102, 241, 0.25)';
          ctx.beginPath();
          for (let i = 0; i < width; i += 4) {
            const wave =
              Math.sin((i * 0.02) + phase) *
              Math.cos((i * 0.01) - phase * 0.5) *
              (isSpeaking ? 24 : 12);
            const y = height / 2 + wave;
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
          }
          ctx.stroke();
        }
      } else {
        // Idle gentle breathing sine wave
        ctx.lineWidth = 2;
        ctx.strokeStyle =
          connectionState === 'connecting'
            ? 'rgba(245, 158, 11, 0.4)'
            : 'rgba(148, 163, 184, 0.35)';

        ctx.beginPath();
        for (let x = 0; x <= width; x += 4) {
          const y =
            height / 2 +
            Math.sin(x * 0.015 + phase) * 8 * Math.sin(phase * 0.8);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [
    connectionState,
    agentAudioState,
    outputAnalyserRef,
    inputAnalyserRef,
    isMuted,
    visualMode,
    volumeBoost,
    boostEnabled,
  ]);

  return (
    <div
      id="audio-visualizer-container"
      className="relative w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-md border border-slate-800 text-white overflow-hidden"
    >
      {/* Top Bar inside Stage */}
      <div className="flex items-center justify-between z-10 relative mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              agentAudioState === 'speaking'
                ? 'bg-emerald-400 animate-ping'
                : agentAudioState === 'listening'
                ? 'bg-blue-400 animate-pulse'
                : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {agentAudioState === 'speaking'
              ? 'Gemini Live Responding'
              : agentAudioState === 'listening'
              ? 'Listening to Microphone'
              : connectionState === 'connecting'
              ? 'Establishing Audio Stream...'
              : 'Voice Session Idle'}
          </span>
          {boostEnabled && volumeBoost > 1.0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              Volume Boost Active
            </span>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setVisualMode('wave')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              visualMode === 'wave'
                ? 'bg-slate-700 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Wave</span>
          </button>
          <button
            type="button"
            onClick={() => setVisualMode('bars')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              visualMode === 'bars'
                ? 'bg-slate-700 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Spectrum</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="w-full h-44 sm:h-52 flex items-center justify-center relative"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Resting Center Icon when disconnected */}
        {connectionState === 'disconnected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-2 shadow-inner">
              <Radio className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Press "Start Live Voice" below to begin conversation
            </p>
          </div>
        )}
      </div>

      {/* Subtle bottom info */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Sample Rate: Output 24kHz • Input 16kHz PCM</span>
        <span className="flex items-center gap-1 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Full Duplex Barge-in Supported
        </span>
      </div>
    </div>
  );
};

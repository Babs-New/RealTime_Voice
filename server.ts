import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const app = express();
const server = http.createServer(app);

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    model: 'gemini-3.1-flash-live-preview',
    voices: ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'],
  });
});

// Setup WebSocket server on path /live
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', (clientWs: WebSocket) => {
  console.log('[WebSocket] Client connected to /live');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        error:
          'GEMINI_API_KEY environment variable is not set. Please configure it in AI Studio Settings > Secrets.',
      })
    );
    clientWs.close(1008, 'Missing API Key');
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  let session: any = null;
  let isClosing = false;

  async function initSession(
    voiceName = 'Zephyr',
    systemInstruction = 'You are a friendly, natural, and responsive real-time voice AI assistant. Keep responses clear, natural, and conversational.'
  ) {
    try {
      clientWs.send(
        JSON.stringify({ type: 'status', message: 'Connecting to Gemini Live API...' })
      );

      session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // 1. Audio stream from model
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'audio',
                      audio: part.inlineData.data,
                    })
                  );
                }
                if (part.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'transcript',
                      role: 'model',
                      text: part.text,
                    })
                  );
                }
              }
            }

            // 2. Transcriptions if emitted
            const serverContent = message.serverContent as any;
            if (serverContent?.outputAudioTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'transcript',
                  role: 'model',
                  text: serverContent.outputAudioTranscription.text,
                })
              );
            }
            if (serverContent?.inputAudioTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'transcript',
                  role: 'user',
                  text: serverContent.inputAudioTranscription.text,
                })
              );
            }

            // 3. User barge-in / Interruption
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            // 4. Turn completion
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }
          },
          onerror: (err: any) => {
            console.error('[Gemini Live Error]:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  error: err?.message || 'Gemini Live encountered an error.',
                })
              );
            }
          },
          onclose: (event: any) => {
            console.log('[Gemini Live Closed]:', event);
            if (!isClosing && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'status',
                  message: 'Gemini session closed.',
                })
              );
            }
          },
        },
      });

      console.log('[Gemini Live] Session connected successfully');
      clientWs.send(
        JSON.stringify({
          type: 'ready',
          voice: voiceName,
          model: 'gemini-3.1-flash-live-preview',
        })
      );
    } catch (err: any) {
      console.error('[Gemini Live Init Failed]:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error:
              err?.message ||
              'Failed to connect to Gemini Live. Check your API key.',
          })
        );
      }
    }
  }

  clientWs.on('message', async (data: any) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'setup') {
        const { voice = 'Zephyr', systemInstruction } = msg;
        await initSession(voice, systemInstruction);
        return;
      }

      if (msg.type === 'audio' && session) {
        // Send PCM 16kHz audio data to Gemini Live
        session.sendRealtimeInput({
          audio: {
            data: msg.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
        return;
      }

      if (msg.type === 'text' && session) {
        // Send text prompt into the live conversation
        session.sendRealtimeInput({
          text: msg.text,
        });
        return;
      }

      if (msg.type === 'ping') {
        clientWs.send(JSON.stringify({ type: 'pong' }));
        return;
      }
    } catch (err) {
      console.error('[WebSocket Message Parse Error]:', err);
    }
  });

  clientWs.on('close', () => {
    console.log('[WebSocket] Client disconnected');
    isClosing = true;
    if (session) {
      try {
        session.close();
      } catch (err) {
        console.error('[Gemini Live Close Error]:', err);
      }
    }
  });
});

// Vite middleware & static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();

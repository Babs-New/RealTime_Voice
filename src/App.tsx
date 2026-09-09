/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { Header } from './components/Header';
import { AudioVisualizer } from './components/AudioVisualizer';
import { LiveControls } from './components/LiveControls';
import { VolumeBoosterPanel } from './components/VolumeBoosterPanel';
import { TranscriptFeed } from './components/TranscriptFeed';
import { SettingsModal } from './components/SettingsModal';
import {
  AlertCircle,
  HelpCircle,
  Sparkles,
  Zap,
  Volume2,
  Mic,
  Radio,
} from 'lucide-react';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
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
    clearTranscripts,
  } = useGeminiLive();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        connectionState={connectionState}
        agentAudioState={agentAudioState}
        volumeBoost={volumeBoost}
        boostEnabled={boostEnabled}
        sessionDuration={sessionDuration}
        latencyMs={latencyMs}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error Alert */}
        {error && (
          <div
            id="global-error-banner"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Connection Notice:</span> {error}
              {error.includes('GEMINI_API_KEY') && (
                <p className="mt-1 text-xs text-rose-700">
                  You can set your Gemini API key under the AI Studio Settings &gt; Secrets menu.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Top Hero Section: Visualizer & Live Controls */}
        <section
          id="hero-visualizer-section"
          className="space-y-4"
        >
          {/* Audio Visualizer Stage */}
          <AudioVisualizer
            connectionState={connectionState}
            agentAudioState={agentAudioState}
            outputAnalyserRef={outputAnalyserRef}
            inputAnalyserRef={inputAnalyserRef}
            isMuted={isMuted}
            volumeBoost={volumeBoost}
            boostEnabled={boostEnabled}
          />

          {/* Controls Bar */}
          <LiveControls
            connectionState={connectionState}
            agentAudioState={agentAudioState}
            isMuted={isMuted}
            liveCaption={liveCaption}
            onConnect={connectLive}
            onDisconnect={disconnect}
            onToggleMute={toggleMute}
            onInterrupt={interruptAgent}
          />
        </section>

        {/* Dual Panels Grid: Volume Booster Panel & Live Transcript Feed */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Volume Booster (Requested Feature) */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            <VolumeBoosterPanel
              volumeBoost={volumeBoost}
              inputGain={inputGain}
              boostEnabled={boostEnabled}
              limiterActive={limiterActive}
              micLevel={micLevel}
              outputLevel={outputLevel}
              isMuted={isMuted}
              onVolumeBoostChange={setVolumeBoost}
              onInputGainChange={setInputGain}
              onToggleBoost={toggleBoost}
              onToggleLimiter={() => setLimiterActive(!limiterActive)}
              onSelectPreset={setBoostPreset}
            />

            {/* Quick Tips & Spoken Prompt Ideas */}
            <div
              id="prompt-tips-card"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Real-Time Voice Tips</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  <span>
                    <strong>Boost Volume:</strong> Increase the amplifier slider up to 400% (+12dB) if your speakers or headphones are quiet. The Dynamics Limiter prevents digital clipping.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <span>
                    <strong>Natural Barge-in:</strong> You can interrupt Gemini at any time just by speaking or pressing the "Interrupt" button.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  <span>
                    <strong>Try saying:</strong> "Explain quantum entanglement in 2 conversational sentences", or "Brainstorm 3 catchy startup names for a coffee subscription".
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Live Transcript Feed */}
          <div className="lg:col-span-6 flex flex-col">
            <TranscriptFeed
              transcripts={transcripts}
              connectionState={connectionState}
              onSendMessage={sendTextMessage}
              onClear={clearTranscripts}
            />
          </div>
        </section>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        selectedPersona={selectedPersona}
        onSelectPersona={setSelectedPersona}
        customPrompt={customPrompt}
        onChangeCustomPrompt={setCustomPrompt}
        isConnected={connectionState === 'connected'}
      />
    </div>
  );
}

import React from 'react';
import { ConnectionState, AgentAudioState } from '../types';
import {
  Volume2,
  Zap,
  Radio,
  Sliders,
  Sparkles,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  connectionState: ConnectionState;
  agentAudioState: AgentAudioState;
  volumeBoost: number;
  boostEnabled: boolean;
  sessionDuration: number;
  latencyMs: number | null;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  agentAudioState,
  volumeBoost,
  boostEnabled,
  sessionDuration,
  latencyMs,
  onOpenSettings,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    if (connectionState === 'connecting') {
      return (
        <span
          id="status-badge-connecting"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          Connecting...
        </span>
      );
    }
    if (connectionState === 'connected') {
      if (agentAudioState === 'speaking') {
        return (
          <span
            id="status-badge-speaking"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Speaking
          </span>
        );
      }
      return (
        <span
          id="status-badge-listening"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Listening Live
        </span>
      );
    }
    if (connectionState === 'error') {
      return (
        <span
          id="status-badge-error"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Connection Issue
        </span>
      );
    }
    return (
      <span
        id="status-badge-idle"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
      >
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        Standby
      </span>
    );
  };

  const boostPercent = Math.round((boostEnabled ? volumeBoost : 1.0) * 100);
  const dbValue =
    boostEnabled && volumeBoost > 1
      ? `+${(20 * Math.log10(volumeBoost)).toFixed(1)} dB`
      : '0 dB';

  return (
    <header
      id="app-header"
      className="w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                Gemini Live Voice AI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Sparkles className="w-3 h-3" />
                Live API 24kHz
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              Low-latency real-time voice streaming with high-gain volume booster
            </p>
          </div>
        </div>

        {/* Status & Volume Boost Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Volume Boost Status Pill */}
          <div
            id="header-volume-boost-indicator"
            className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
              boostEnabled && volumeBoost > 1.0
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm shadow-amber-50'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <Zap
              className={`w-3.5 h-3.5 ${
                boostEnabled && volumeBoost > 1.0
                  ? 'text-amber-600 fill-amber-500'
                  : 'text-slate-400'
              }`}
            />
            <span>Boost:</span>
            <span className="font-bold text-slate-900">{boostPercent}%</span>
            <span className="text-[10px] text-amber-700 font-mono bg-amber-100/70 px-1.5 py-0.2 rounded">
              {dbValue}
            </span>
          </div>

          {/* Session Timer (if connected) */}
          {connectionState === 'connected' && (
            <div
              id="header-session-timer"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-medium"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTime(sessionDuration)}</span>
            </div>
          )}

          {/* Connection Status Badge */}
          {getStatusBadge()}

          {/* Settings Trigger */}
          <button
            id="header-settings-button"
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Voice & Agent Persona Settings"
          >
            <Sliders className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

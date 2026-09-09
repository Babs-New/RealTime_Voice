import React from 'react';
import { ConnectionState, AgentAudioState } from '../types';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Square,
  Volume2,
  Sparkles,
  Zap,
} from 'lucide-react';

interface LiveControlsProps {
  connectionState: ConnectionState;
  agentAudioState: AgentAudioState;
  isMuted: boolean;
  liveCaption: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
}

export const LiveControls: React.FC<LiveControlsProps> = ({
  connectionState,
  agentAudioState,
  isMuted,
  liveCaption,
  onConnect,
  onDisconnect,
  onToggleMute,
  onInterrupt,
}) => {
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  return (
    <div
      id="live-controls-container"
      className="flex flex-col items-center gap-4 w-full"
    >
      {/* Live caption pill */}
      {isConnected && liveCaption && (
        <div
          id="live-caption-banner"
          className="w-full max-w-2xl px-4 py-2.5 rounded-xl bg-slate-900/90 text-white text-xs sm:text-sm font-medium border border-slate-700 shadow-md backdrop-blur-sm flex items-center gap-3 animate-fadeIn"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <p className="truncate flex-1 text-slate-100">
            "{liveCaption}"
          </p>
        </div>
      )}

      {/* Main Control Action Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-2 bg-slate-50 border border-slate-200/90 rounded-2xl shadow-sm">
        {/* Mic Mute Toggle */}
        <button
          type="button"
          id="mic-mute-toggle-button"
          onClick={onToggleMute}
          disabled={!isConnected}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            !isConnected
              ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400'
              : isMuted
              ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 shadow-sm'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? (
            <>
              <MicOff className="w-4 h-4 text-rose-600" />
              <span>Mic Muted</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-blue-600" />
              <span>Mute Mic</span>
            </>
          )}
        </button>

        {/* Primary Call / Start Voice Session Button */}
        {!isConnected ? (
          <button
            type="button"
            id="start-live-session-button"
            onClick={onConnect}
            disabled={isConnecting}
            className="flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <PhoneCall className="w-5 h-5" />
            <span>
              {isConnecting ? 'Starting Session...' : 'Start Live Voice'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            id="end-live-session-button"
            onClick={onDisconnect}
            className="flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-md shadow-rose-200 active:scale-[0.98] transition-all"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Session</span>
          </button>
        )}

        {/* Interrupt / Barge-in Button */}
        <button
          type="button"
          id="interrupt-agent-button"
          onClick={onInterrupt}
          disabled={!isConnected || agentAudioState !== 'speaking'}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            !isConnected || agentAudioState !== 'speaking'
              ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400'
              : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 shadow-sm animate-pulse'
          }`}
          title="Interrupt Gemini output immediately (Barge-in)"
        >
          <Square className="w-4 h-4 fill-amber-700 text-amber-700" />
          <span>Interrupt</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { VoiceName } from '../types';
import { VOICE_OPTIONS, PERSONA_OPTIONS } from '../data/presets';
import { X, Check, Volume2, Sparkles, Mic2, Settings2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  selectedPersona: string;
  onSelectPersona: (id: string) => void;
  customPrompt: string;
  onChangeCustomPrompt: (prompt: string) => void;
  isConnected: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  selectedPersona,
  onSelectPersona,
  customPrompt,
  onChangeCustomPrompt,
  isConnected,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div
        id="settings-modal"
        className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Agent Voice & Persona Settings
            </h3>
          </div>
          <button
            type="button"
            id="close-settings-modal-button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isConnected && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Note: Updating voice or system persona will apply when reconnecting a new live session.
              </span>
            </div>
          )}

          {/* Voice Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Mic2 className="w-4 h-4 text-indigo-600" />
              Select Gemini Live Voice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VOICE_OPTIONS.map((voice) => {
                const isSelected = selectedVoice === voice.id;
                return (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => onSelectVoice(voice.id)}
                    className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">
                        {voice.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <span className="text-[11px] text-indigo-700 font-medium mb-1">
                      {voice.gender}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {voice.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Persona Presets */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Agent Behavior & Persona
            </label>
            <div className="space-y-2">
              {PERSONA_OPTIONS.map((persona) => {
                const isSelected = selectedPersona === persona.id;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => {
                      onSelectPersona(persona.id);
                      onChangeCustomPrompt('');
                    }}
                    className={`w-full p-3 rounded-xl text-left border transition-all flex items-start justify-between gap-3 ${
                      isSelected && !customPrompt
                        ? 'bg-indigo-50/70 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 mb-0.5">
                        {persona.name}
                      </div>
                      <p className="text-xs text-slate-500">
                        {persona.description}
                      </p>
                    </div>
                    {isSelected && !customPrompt && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom System Instruction */}
          <div className="space-y-2">
            <label
              htmlFor="custom-system-prompt"
              className="text-xs font-bold text-slate-800 uppercase tracking-wider"
            >
              Custom System Prompt (Optional Override)
            </label>
            <textarea
              id="custom-system-prompt"
              rows={3}
              value={customPrompt}
              onChange={(e) => onChangeCustomPrompt(e.target.value)}
              placeholder="E.g., You are a witty podcast host interviewing me about recent developments in artificial intelligence..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

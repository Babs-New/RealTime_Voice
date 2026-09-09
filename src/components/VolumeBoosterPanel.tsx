import React from 'react';
import {
  Volume2,
  VolumeX,
  Zap,
  ShieldCheck,
  Mic,
  Sliders,
  Sparkles,
  Gauge,
  Info,
} from 'lucide-react';
import { BOOST_PRESETS } from '../data/presets';
import { linearToDb } from '../utils/audioUtils';

interface VolumeBoosterPanelProps {
  volumeBoost: number;
  inputGain: number;
  boostEnabled: boolean;
  limiterActive: boolean;
  micLevel: number;
  outputLevel: number;
  isMuted: boolean;
  onVolumeBoostChange: (val: number) => void;
  onInputGainChange: (val: number) => void;
  onToggleBoost: () => void;
  onToggleLimiter: () => void;
  onSelectPreset: (val: number) => void;
}

export const VolumeBoosterPanel: React.FC<VolumeBoosterPanelProps> = ({
  volumeBoost,
  inputGain,
  boostEnabled,
  limiterActive,
  micLevel,
  outputLevel,
  isMuted,
  onVolumeBoostChange,
  onInputGainChange,
  onToggleBoost,
  onToggleLimiter,
  onSelectPreset,
}) => {
  const currentBoostPercent = Math.round(
    (boostEnabled ? volumeBoost : 1.0) * 100
  );
  const currentDb =
    boostEnabled && volumeBoost > 1.0
      ? `+${(20 * Math.log10(volumeBoost)).toFixed(1)} dB`
      : '0.0 dB';

  const micDb = Math.round(linearToDb(micLevel));
  const outputDb = Math.round(linearToDb(outputLevel));

  return (
    <div
      id="volume-booster-panel"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
    >
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              boostEnabled && volumeBoost > 1.0
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Voice Volume Booster
              </h2>
              {boostEnabled && volumeBoost > 1.0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {currentDb}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              High-gain digital amplifier with soft-knee dynamics limiter
            </p>
          </div>
        </div>

        {/* Master Boost Toggle */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-600">
            Boost Power:
          </span>
          <button
            type="button"
            id="volume-boost-toggle-button"
            onClick={onToggleBoost}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
              boostEnabled ? 'bg-amber-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                boostEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Boost Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        {/* Left Column: Output Amplifier Slider & Presets */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="volume-boost-slider"
              className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Volume2 className="w-4 h-4 text-indigo-600" />
              Agent Output Amplifier
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {currentBoostPercent}%
              </span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {currentDb}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-1.5">
            <input
              id="volume-boost-slider"
              type="range"
              min="1.0"
              max="4.0"
              step="0.05"
              value={volumeBoost}
              onChange={(e) => onVolumeBoostChange(parseFloat(e.target.value))}
              disabled={!boostEnabled}
              className={`w-full h-2.5 rounded-lg appearance-none cursor-pointer accent-amber-500 transition-opacity ${
                !boostEnabled ? 'opacity-40 cursor-not-allowed bg-slate-200' : 'bg-slate-200'
              }`}
            />
            <div className="flex justify-between text-[11px] text-slate-600 font-medium px-0.5">
              <span>100% (Standard)</span>
              <span>200% (+6dB)</span>
              <span>300% (+9.5dB)</span>
              <span>400% Max (+12dB)</span>
            </div>
          </div>

          {/* Quick Boost Preset Buttons */}
          <div className="pt-2">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">
              Quick Boost Presets:
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {BOOST_PRESETS.map((preset) => {
                const isSelected =
                  boostEnabled && Math.abs(volumeBoost - preset.value) < 0.05;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onSelectPreset(preset.value)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold">
                      {Math.round(preset.value * 100)}%
                    </span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-amber-100' : 'text-slate-600 font-semibold'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart Limiter Toggle Note */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className={`w-4 h-4 ${
                  limiterActive ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">
                  Dynamics Limiter
                </span>
                <p className="text-[11px] text-slate-500">
                  Compresses excessive peaks to protect against speaker distortion
                </p>
              </div>
            </div>
            <button
              type="button"
              id="toggle-limiter-button"
              onClick={onToggleLimiter}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                limiterActive
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {limiterActive ? 'Active' : 'Bypassed'}
            </button>
          </div>
        </div>

        {/* Right Column: Microphone Gain & Live VU Level Meters */}
        <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-slate-100 lg:pl-6">
          {/* Mic Input Gain */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="input-gain-slider"
                className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5 text-blue-600" />
                Mic Input Gain
              </label>
              <span className="text-xs font-bold text-slate-700 font-mono">
                {Math.round(inputGain * 100)}%
              </span>
            </div>
            <input
              id="input-gain-slider"
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={inputGain}
              onChange={(e) => onInputGainChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-medium">
              <span>50% (Low)</span>
              <span>100% (Normal)</span>
              <span>300% (Boosted)</span>
            </div>
          </div>

          {/* Live Audio Level Meters */}
          <div className="space-y-3 pt-1">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Real-time Signal Levels
            </div>

            {/* Mic Level Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isMuted ? 'bg-rose-500' : 'bg-blue-500'
                    }`}
                  />
                  Microphone Signal {isMuted ? '(Muted)' : ''}
                </span>
                <span className="font-mono text-[10px] text-slate-600 font-semibold">
                  {isMuted ? '-inf' : `${micDb} dB`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500"
                  style={{ width: `${Math.min(100, Math.round(micLevel * 100))}%` }}
                />
              </div>
            </div>

            {/* Output Level Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Gemini Voice Output
                </span>
                <span className="font-mono text-[10px] text-slate-600 font-semibold">
                  {outputDb} dB
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                  style={{ width: `${Math.min(100, Math.round(outputLevel * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

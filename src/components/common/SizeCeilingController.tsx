import React from 'react';
import { Sliders, Minus, Plus, RotateCcw } from 'lucide-react';

export interface SizePreset {
  label?: string;
  kb: number;
  badge?: string;
}

interface SizeCeilingControllerProps {
  currentKB: number;
  defaultKB?: number;
  minKB?: number;
  maxKB?: number;
  presets?: (number | SizePreset)[];
  step?: number;
  accentColor?: 'emerald' | 'blue' | 'amber' | 'cyan';
  label?: string;
  onChange: (kb: number) => void;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}

export const SizeCeilingController: React.FC<SizeCeilingControllerProps> = ({
  currentKB,
  defaultKB,
  minKB = 5,
  maxKB = 2000,
  presets = [20, 50, 100, 200],
  step = 5,
  accentColor = 'emerald',
  label = 'Target Max Size',
  onChange,
  onReset,
  showReset = false,
  className = '',
}) => {
  // Theme color tokens
  const colorMap = {
    emerald: {
      text: 'text-emerald-400',
      textActive: 'text-emerald-300',
      bgActive: 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20',
      borderActive: 'border-emerald-400',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      accent: 'accent-emerald-500',
      ring: 'focus-visible:ring-emerald-400',
    },
    blue: {
      text: 'text-blue-400',
      textActive: 'text-blue-300',
      bgActive: 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20',
      borderActive: 'border-blue-400',
      badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      accent: 'accent-blue-500',
      ring: 'focus-visible:ring-blue-400',
    },
    amber: {
      text: 'text-amber-400',
      textActive: 'text-amber-300',
      bgActive: 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20',
      borderActive: 'border-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      accent: 'accent-amber-500',
      ring: 'focus-visible:ring-amber-400',
    },
    cyan: {
      text: 'text-cyan-400',
      textActive: 'text-cyan-300',
      bgActive: 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20',
      borderActive: 'border-cyan-400',
      badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
      accent: 'accent-cyan-500',
      ring: 'focus-visible:ring-cyan-400',
    },
  };

  const theme = colorMap[accentColor] || colorMap.emerald;

  const handleStep = (delta: number) => {
    const nextVal = Math.max(minKB, Math.min(maxKB, currentKB + delta));
    onChange(nextVal);
  };

  const handleInputChange = (valStr: string) => {
    const num = Number(valStr);
    if (!isNaN(num)) {
      onChange(Math.max(minKB, Math.min(maxKB, num)));
    }
  };

  return (
    <div className={`space-y-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800/90 ${className}`}>
      {/* Header with Title & Reset Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sliders className={`w-3.5 h-3.5 ${theme.text}`} />
          <span className="text-[11px] font-bold text-slate-200 tracking-wide uppercase">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showReset && onReset && defaultKB !== undefined && currentKB !== defaultKB && (
            <button
              type="button"
              onClick={onReset}
              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors underline decoration-slate-600"
              title={`Reset to official default (${defaultKB} KB)`}
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset default ({defaultKB} KB)</span>
            </button>
          )}

          <span className={`text-xs font-mono font-extrabold ${theme.text} px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800`}>
            {currentKB >= 1024 ? `${(currentKB / 1024).toFixed(1)} MB` : `${currentKB} KB`}
          </span>
        </div>
      </div>

      {/* Tactile Preset Chips Row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((p, idx) => {
          const kbVal = typeof p === 'number' ? p : p.kb;
          const labelText = typeof p === 'number' ? `${p} KB` : p.label || `${p.kb} KB`;
          const badgeText = typeof p === 'object' ? p.badge : undefined;
          const isSelected = currentKB === kbVal;

          return (
            <button
              key={`${kbVal}-${idx}`}
              type="button"
              onClick={() => onChange(kbVal)}
              className={`flex-1 min-w-[58px] py-1 px-1.5 rounded-xl text-xs font-mono transition-all flex flex-col items-center justify-center border ${
                isSelected
                  ? `${theme.bgActive} border-transparent scale-[1.02]`
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <span className="text-[11px] font-bold">{labelText}</span>
              {badgeText && (
                <span className={`text-[8.5px] uppercase tracking-wider ${isSelected ? 'opacity-90' : 'text-slate-500'}`}>
                  {badgeText}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Steppers & Manual Input & Smooth Range Scrubber */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center gap-2">
          {/* Stepper Down */}
          <button
            type="button"
            onClick={() => handleStep(-step)}
            disabled={currentKB <= minKB}
            className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title={`Decrease by ${step} KB`}
            aria-label={`Decrease ceiling by ${step} KB`}
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Smooth Range Slider */}
          <input
            type="range"
            min={minKB}
            max={Math.max(maxKB, 500)}
            step={step}
            value={currentKB}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${theme.accent}`}
            aria-label="Adjust file size ceiling slider"
          />

          {/* Stepper Up */}
          <button
            type="button"
            onClick={() => handleStep(step)}
            disabled={currentKB >= maxKB}
            className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title={`Increase by ${step} KB`}
            aria-label={`Increase ceiling by ${step} KB`}
          >
            <Plus className="w-3 h-3" />
          </button>

          {/* Direct Fine-Tuning Box */}
          <div className="flex items-center gap-1 shrink-0 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
            <input
              type="number"
              min={minKB}
              max={maxKB}
              value={currentKB}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`w-14 bg-transparent text-xs font-mono font-bold ${theme.text} text-right outline-none`}
              aria-label="Direct custom KB limit"
            />
            <span className="text-slate-400 font-mono text-[11px]">KB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

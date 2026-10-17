import React from 'react';
import { Sparkles, Wand2, RotateCcw } from 'lucide-react';
import type { FilterState } from '../../store/useDossierStore';

interface SignatureEnhancerProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onApply: () => void;
  className?: string;
}

export const SignatureEnhancer: React.FC<SignatureEnhancerProps> = ({
  filters,
  onFilterChange,
  onApply,
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-2xl bg-card border border-border shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-soft border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Signature Ink Clarifier
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Bleaches desk shadows to #FFFFFF & sharpens blue/black ink
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onFilterChange({ bleachThreshold: 185, inkDarkness: 1.3 });
            onApply();
          }}
          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
          title="Reset ink filters"
        >
          <RotateCcw className="w-3 h-3" /> Auto
        </button>
      </div>

      {/* Bleach Threshold Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="bleach-slider" className="text-foreground font-medium">
            Paper Bleach Intensity
          </label>
          <span className="font-mono text-primary font-semibold">
            {filters.bleachThreshold} / 255
          </span>
        </div>
        <input
          id="bleach-slider"
          type="range"
          min="120"
          max="240"
          step="1"
          value={filters.bleachThreshold}
          onChange={(e) => {
            onFilterChange({ bleachThreshold: Number(e.target.value) });
          }}
          onMouseUp={onApply}
          onTouchEnd={onApply}
          onKeyUp={onApply}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Gentle</span>
          <span>Aggressive (#FFFFFF)</span>
        </div>
      </div>

      {/* Ink Darken Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="ink-slider" className="text-foreground font-medium">
            Pen Stroke Contrast Boost
          </label>
          <span className="font-mono text-primary font-semibold">
            {filters.inkDarkness.toFixed(1)}x
          </span>
        </div>
        <input
          id="ink-slider"
          type="range"
          min="0.8"
          max="2.5"
          step="0.1"
          value={filters.inkDarkness}
          onChange={(e) => {
            onFilterChange({ inkDarkness: Number(e.target.value) });
          }}
          onMouseUp={onApply}
          onTouchEnd={onApply}
          onKeyUp={onApply}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Natural Ink</span>
          <span>Ultra-Bold High Contrast</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border">
        <Wand2 className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>
          Eliminates off-white paper wrinkles so signatures remain crisp under 20 KB.
        </span>
      </div>
    </div>
  );
};

import React from 'react';
import { PackageCheck, Layers, ChevronDown } from 'lucide-react';
import { useDossierStore } from '../../store/useDossierStore';
import { usePresetStore } from '../../store/usePresetStore';
import { PresetSelector } from '../presets/PresetSelector';

export const ModeTabBar: React.FC = () => {
  const { activeMode, setMode } = useDossierStore();
  const activePreset = usePresetStore((s) => s.getActivePreset());

  return (
    <div className="w-full space-y-3">
      {/* Human-Friendly Dual Mode Tabs */}
      <div
        className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted p-1.5 border border-border shadow-card"
        role="tablist"
        aria-label="Application preparation mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'dossier'}
          onClick={() => setMode('dossier')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold sm:text-base transition-all ${
            activeMode === 'dossier'
              ? 'bg-card text-foreground shadow-card font-bold border border-border/80'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <PackageCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <span className="truncate">Guided: {activePreset.name}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'sandbox'}
          onClick={() => setMode('sandbox')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold sm:text-base transition-all ${
            activeMode === 'sandbox'
              ? 'bg-card text-foreground shadow-card font-bold border border-border/80'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Layers className="w-5 h-5 text-emerald-500 shrink-0" aria-hidden="true" />
          <span className="truncate">Many files, my own rules</span>
        </button>
      </div>

      {/* Preset Quick Change Bar in Guided Mode */}
      {activeMode === 'dossier' && (
        <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border shadow-card text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Active Portal Rules:</span>
            <span className="font-bold text-foreground truncate">{activePreset.name}</span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-muted-foreground font-mono text-[11px] hidden sm:inline">
              {activePreset.authority}
            </span>
          </div>

          <PresetSelector
            customTrigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="px-3 py-1.5 rounded-xl border border-border bg-muted hover:bg-card text-foreground font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                <span>Change Target Form</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          />
        </div>
      )}
    </div>
  );
};

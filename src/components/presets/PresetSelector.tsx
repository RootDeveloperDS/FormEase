import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, Plus, Globe, X } from 'lucide-react';
import { usePresetStore } from '../../store/usePresetStore';
import { useDossierStore } from '../../store/useDossierStore';
import { CustomPresetModal } from './CustomPresetModal';

interface PresetSelectorProps {
  customTrigger?: (open: () => void) => React.ReactNode;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ customTrigger }) => {
  const { allPresets, activePresetId, setActivePreset, getActivePreset } = usePresetStore();
  const { optimizeAllSlots, resetAllSlotCustomTargets } = useDossierStore();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IN' | 'US' | 'GLOBAL' | 'CUSTOM'>('ALL');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const activePreset = getActivePreset();
  const presets = allPresets();

  const filtered = presets.filter((p) => {
    const matchesFilter =
      activeFilter === 'ALL' ||
      (activeFilter === 'CUSTOM' ? p.isCustom : p.country === activeFilter);
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.authority.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const handleSelect = async (id: string) => {
    resetAllSlotCustomTargets();
    setActivePreset(id);
    setIsOpen(false);
    await optimizeAllSlots();
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const modalContent = isOpen ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-picker-title"
      className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border text-card-foreground rounded-3xl shadow-lift overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Search Bar */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-border bg-muted/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Search className="w-5 h-5 text-primary shrink-0" />
            <input
              id="portal-picker-title"
              type="text"
              placeholder="Search official portals (UPSC, US Visa, SSC, NTA, Schengen)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="shrink-0 flex border-b border-border bg-muted/20 px-4 py-2.5 gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Portals' },
            { id: 'IN', label: '🇮🇳 India Standards' },
            { id: 'US', label: '🇺🇸 US & Visas' },
            { id: 'GLOBAL', label: '🌐 Global & EU' },
            { id: 'CUSTOM', label: '⚙️ My Custom' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Presets List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No portals match "{search}".
            </div>
          ) : (
            filtered.map((preset) => {
              const isSelected = preset.id === activePresetId;
              return (
                <div
                  key={preset.id}
                  className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col gap-3 group ${
                    isSelected
                      ? 'bg-primary-soft border-primary/60 text-foreground shadow-md ring-1 ring-primary/40'
                      : 'bg-card border-border text-foreground hover:bg-muted/40 hover:border-primary/40 shadow-sm'
                  }`}
                >
                  {/* Top Row: Country Flag, Name, Action Buttons */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      onClick={() => handleSelect(preset.id)}
                    >
                      <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-muted border border-border">
                        {preset.countryFlag || '📄'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {preset.name}
                        </h4>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {preset.authority}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-soft px-2.5 py-1 rounded-full border border-primary/30 shadow-sm">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelect(preset.id)}
                          className="shrink-0 px-3 py-1 rounded-xl bg-primary-soft hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold transition-colors"
                        >
                          Select Schema
                        </button>
                      )}
                    </div>
                  </div>

                  <p
                    className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                    onClick={() => handleSelect(preset.id)}
                  >
                    {preset.description}
                  </p>

                  {/* Requirement Pills */}
                  <div
                    className="flex flex-wrap items-center gap-2 pt-1 cursor-pointer"
                    onClick={() => handleSelect(preset.id)}
                  >
                    {preset.slots.photo && (
                      <span className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-muted text-primary border border-border whitespace-nowrap">
                        📸 Photo: &lt; {Math.round(preset.slots.photo.targetMaxBytes / 1024)} KB
                        <span className="text-muted-foreground ml-1">({preset.slots.photo.aspectRatio})</span>
                      </span>
                    )}
                    {preset.slots.signature && (
                      <span className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-muted text-blue-500 border border-border whitespace-nowrap">
                        ✍️ Sig: &lt; {Math.round(preset.slots.signature.targetMaxBytes / 1024)} KB
                        <span className="text-muted-foreground ml-1">({preset.slots.signature.aspectRatio})</span>
                      </span>
                    )}
                    {preset.slots.document && (
                      <span className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-muted text-amber-500 border border-border whitespace-nowrap">
                        📄 Doc: &lt; {Math.round(preset.slots.document.targetMaxBytes / 1024)} KB
                        <span className="text-muted-foreground ml-1">
                          ({preset.slots.document.defaultFormat === 'application/pdf' ? 'PDF' : 'JPEG'})
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Bar: Create Custom Preset */}
        <div className="shrink-0 p-4 sm:p-5 bg-muted/40 border-t border-border flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
            <Globe className="w-4 h-4 text-primary shrink-0" />
            <span className="hidden sm:inline">Official Government & Visa Schemas</span>
            <span className="sm:hidden">Official Schemas</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsCustomModalOpen(true);
            }}
            className="shrink-0 px-4 py-2 rounded-xl bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-2 border border-border hover:border-primary/40 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-primary shrink-0" />
            <span>Create Custom Preset</span>
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {customTrigger ? (
        customTrigger(() => setIsOpen(true))
      ) : (
        /* Default Trigger Button in Header */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted text-left transition-all shadow-card group shrink-0"
        >
          <span className="text-base shrink-0">{activePreset.countryFlag || '🌐'}</span>
          <div className="min-w-0 pr-0.5">
            <div className="text-[9px] uppercase font-bold text-primary tracking-wider leading-none">
              Target Form
            </div>
            <div className="text-xs font-bold text-foreground truncate max-w-[140px] leading-tight">
              {activePreset.name}
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform" />
        </button>
      )}

      {typeof document !== 'undefined' && createPortal(modalContent, document.body)}
      <CustomPresetModal isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)} />
    </>
  );
};

export default PresetSelector;

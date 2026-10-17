import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, Plus, Globe, X, Settings2 } from 'lucide-react';
import { usePresetStore } from '../../store/usePresetStore';
import { useDossierStore } from '../../store/useDossierStore';
import { CustomPresetModal } from './CustomPresetModal';

export const PresetSelector: React.FC = () => {
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
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.authority.toLowerCase().includes(search.toLowerCase());
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
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Search Bar (shrink-0 ensures it NEVER compresses) */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Search className="w-5 h-5 text-emerald-400 shrink-0" />
            <input
              id="portal-picker-title"
              type="text"
              placeholder="Search official portals (UPSC, US Visa, SSC, NTA, Schengen)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Tabs (shrink-0 ensures it NEVER compresses) */}
        <div className="shrink-0 flex border-b border-slate-800 bg-slate-950/50 px-4 py-2.5 gap-2 overflow-x-auto no-scrollbar">
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
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Presets List (min-h-0 is MANDATORY for flexbox scrollable container!) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
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
                      ? 'bg-emerald-950/30 border-emerald-500/60 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800/90 text-slate-200 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  {/* Top Row: Country Flag, Name, Action Buttons */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      onClick={() => handleSelect(preset.id)}
                    >
                      <span className="text-2xl shrink-0 p-1 rounded-xl bg-slate-900 border border-slate-800">
                        {preset.countryFlag || '📄'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                          {preset.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {preset.authority}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelect(preset.id)}
                          className="shrink-0 px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors"
                        >
                          Select Schema
                        </button>
                      )}

                      {/* Customize Button to duplicate or edit preset rules */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          setIsCustomModalOpen(true);
                        }}
                        className="shrink-0 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="Customize ceilings and save as personal preset"
                      >
                        <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    className="text-xs text-slate-400 leading-relaxed cursor-pointer"
                    onClick={() => handleSelect(preset.id)}
                  >
                    {preset.description}
                  </p>

                  {/* Requirement Pills (shrink-0 & whitespace-nowrap ensure they are NEVER squashed) */}
                  <div
                    className="flex flex-wrap items-center gap-2 pt-1 cursor-pointer"
                    onClick={() => handleSelect(preset.id)}
                  >
                    {preset.slots.photo && (
                      <span className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-300 border border-slate-800 whitespace-nowrap">
                        📸 Photo: &lt; {Math.round(preset.slots.photo.targetMaxBytes / 1024)} KB
                        <span className="text-slate-500 ml-1">({preset.slots.photo.aspectRatio})</span>
                      </span>
                    )}
                    {preset.slots.signature && (
                      <span className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-blue-300 border border-slate-800 whitespace-nowrap">
                        ✍️ Sig: &lt; {Math.round(preset.slots.signature.targetMaxBytes / 1024)} KB
                        <span className="text-slate-500 ml-1">({preset.slots.signature.aspectRatio})</span>
                      </span>
                    )}
                    {preset.slots.document && (
                      <span className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 border border-slate-800 whitespace-nowrap">
                        📄 Doc: &lt; {Math.round(preset.slots.document.targetMaxBytes / 1024)} KB
                        <span className="text-slate-500 ml-1">({preset.slots.document.defaultFormat === 'application/pdf' ? 'PDF' : 'JPEG'})</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Bar: Create Custom Preset (shrink-0 ensures it NEVER compresses) */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 shrink-0">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Official Government & Visa Schemas</span>
            <span className="sm:hidden">Official Schemas</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsCustomModalOpen(true);
            }}
            className="shrink-0 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-100 flex items-center gap-2 border border-slate-700 hover:border-emerald-500/40 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Create Custom Preset</span>
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 text-left transition-all shadow-sm group shrink-0"
      >
        <span className="text-base shrink-0">{activePreset.countryFlag || '🌐'}</span>
        <div className="min-w-0 pr-0.5">
          <div className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider leading-none">
            Portal Schema
          </div>
          <div className="text-xs font-bold text-slate-100 truncate max-w-[130px] sm:max-w-[160px] leading-tight mt-0.5">
            {activePreset.name}
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-transform shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Render Modal via React Portal directly into document.body */}
      {typeof document !== 'undefined' && createPortal(modalContent, document.body)}

      <CustomPresetModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
      />
    </>
  );
};

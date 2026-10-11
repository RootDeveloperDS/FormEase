import React, { useState } from 'react';
import { Search, ChevronDown, Check, Plus, Globe } from 'lucide-react';
import { usePresetStore } from '../../store/usePresetStore';
import { useDossierStore } from '../../store/useDossierStore';
import { CustomPresetModal } from './CustomPresetModal';

export const PresetSelector: React.FC = () => {
  const { allPresets, activePresetId, setActivePreset, getActivePreset } = usePresetStore();
  const { optimizeAllSlots } = useDossierStore();

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
    setActivePreset(id);
    setIsOpen(false);
    await optimizeAllSlots();
  };

  return (
    <>
      {/* Trigger Button in Header/Toolbar */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800 text-left transition-all shadow-md group"
        >
          <span className="text-xl shrink-0">{activePreset.countryFlag || '🌐'}</span>
          <div className="min-w-0 pr-1">
            <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider leading-tight">
              Portal Schema
            </div>
            <div className="text-xs font-bold text-slate-100 truncate max-w-[160px] sm:max-w-[220px]">
              {activePreset.name}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Search Bar */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search government portals (UPSC, US Visa, SSC, Schengen, etc.)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md"
                >
                  ESC
                </button>
              </div>

              {/* Country Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-950/30 px-3 py-2 gap-1 overflow-x-auto">
                {[
                  { id: 'ALL', label: 'All Schemas' },
                  { id: 'IN', label: '🇮🇳 India Standards' },
                  { id: 'US', label: '🇺🇸 US & Visas' },
                  { id: 'GLOBAL', label: '🌐 Global & EU' },
                  { id: 'CUSTOM', label: '⚙️ My Custom' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      activeFilter === tab.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Presets List */}
              <div className="max-h-[380px] overflow-y-auto p-3 space-y-2">
                {filtered.map((preset) => {
                  const isSelected = preset.id === activePresetId;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelect(preset.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 group ${
                        isSelected
                          ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-800/90 text-slate-200 hover:bg-slate-800/70 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl mt-0.5 shrink-0">{preset.countryFlag || '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold truncate group-hover:text-emerald-400">
                            {preset.name}
                          </h4>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {preset.description}
                        </p>
                        {/* Requirement pills */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {preset.slots.photo && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-emerald-300 border border-slate-700">
                              Photo: &lt; {Math.round(preset.slots.photo.targetMaxBytes / 1024)} KB
                            </span>
                          )}
                          {preset.slots.signature && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-blue-300 border border-slate-700">
                              Sig: &lt; {Math.round(preset.slots.signature.targetMaxBytes / 1024)} KB
                            </span>
                          )}
                          {preset.slots.document && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-yellow-300 border border-slate-700">
                              Doc: &lt; {Math.round(preset.slots.document.targetMaxBytes / 1024)} KB
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Bar: Create Custom Preset */}
              <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Need custom constraints?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCustomModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-100 flex items-center gap-1.5 border border-slate-700 hover:border-emerald-500/40"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" /> Create Custom Preset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CustomPresetModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
      />
    </>
  );
};

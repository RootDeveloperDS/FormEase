import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePresetStore } from '../../store/usePresetStore';
import { useDossierStore } from '../../store/useDossierStore';
import { PhotoSlotCard } from './slots/PhotoSlotCard';
import { SignatureSlotCard } from './slots/SignatureSlotCard';
import { DocumentSlotCard } from './slots/DocumentSlotCard';
import { Sparkles, BookmarkPlus, Check, X } from 'lucide-react';

export const DossierSlotsView: React.FC = () => {
  const activePreset = usePresetStore((s) => s.getActivePreset());
  const {
    photoSlot,
    signatureSlot,
    documentSlot,
    saveCurrentAsCustomPreset,
    loadDemoDossier,
  } = useDossierStore();

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const hasAnyFile = !!(photoSlot.file || signatureSlot.file || documentSlot.file);

  // Check if any slot has custom overrides
  const isCustomized =
    !!photoSlot.customTargetMaxKB ||
    !!signatureSlot.customTargetMaxKB ||
    !!documentSlot.customTargetMaxKB;

  // Determine active slots count and dynamic responsive grid
  const activeSlotKeys = (['photo', 'signature', 'document'] as const).filter(
    (k) => !!activePreset.slots[k]
  );

  const gridClass =
    activeSlotKeys.length === 1
      ? 'max-w-lg mx-auto grid-cols-1'
      : activeSlotKeys.length === 2
      ? 'max-w-5xl mx-auto grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPresetName.trim()) return;
    saveCurrentAsCustomPreset(customPresetName);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSaveModalOpen(false);
      setCustomPresetName('');
    }, 1200);
  };

  return (
    <div className="space-y-5">
      {/* Contextual Quick Demo Helper when slots are empty */}
      {!hasAnyFile && (
        <div className="flex items-center justify-between flex-wrap gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Evaluating FormEase? Test the biometric pipeline immediately:</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              setIsLoadingDemo(true);
              try {
                await loadDemoDossier();
              } finally {
                setIsLoadingDemo(false);
              }
            }}
            disabled={isLoadingDemo}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>{isLoadingDemo ? 'Generating demo set...' : '✨ Load Complete Demo Set'}</span>
          </button>
        </div>
      )}
      {/* Customized Rules Banner (appears when user tweaks limits) */}
      {isCustomized && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-200">
              You customized constraints for <strong className="text-white">{activePreset.name}</strong>. Save this configuration for 1-click reuse anytime.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCustomPresetName(`${activePreset.name} (Custom)`);
              setIsSaveModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Custom Preset</span>
          </button>
        </div>
      )}

      {/* Dynamic Balanced Slots Grid */}
      <div className={`grid gap-6 ${gridClass}`}>
        {/* SLOT 1: PHOTOGRAPH */}
        {activePreset.slots.photo && <PhotoSlotCard />}

        {/* SLOT 2: SIGNATURE */}
        {activePreset.slots.signature && <SignatureSlotCard />}

        {/* SLOT 3: CERTIFICATE / DOCUMENT */}
        {activePreset.slots.document && <DocumentSlotCard />}
      </div>

      {/* Save Custom Preset Dialog */}
      {isSaveModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setIsSaveModalOpen(false)}
          >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Save Custom Preset Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will save your custom KB ceilings, proportions, and document settings to browser memory (localStorage). You can select it anytime under the "My Custom" tab.
            </p>

            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Preset Profile Name
                </label>
                <input
                  type="text"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  placeholder="e.g., State Scholarship Package 2026"
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveSuccess}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </>
                  ) : (
                    'Save to Presets'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

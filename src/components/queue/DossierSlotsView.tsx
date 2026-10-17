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
        <div className="flex items-center justify-between flex-wrap gap-2.5 px-4 py-2.5 rounded-2xl bg-muted/60 border border-border text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
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
            className="px-3 py-1.5 rounded-xl bg-primary-soft hover:bg-primary/20 border border-primary/30 text-primary font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>{isLoadingDemo ? 'Generating demo set...' : '✨ Load Complete Demo Set'}</span>
          </button>
        </div>
      )}
      {/* Customized Rules Banner (appears when user tweaks limits) */}
      {isCustomized && (
        <div className="p-3.5 rounded-2xl bg-primary-soft/50 border border-primary/30 flex items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs text-foreground">
              You customized constraints for <strong className="text-foreground font-semibold">{activePreset.name}</strong>. Save this configuration for 1-click reuse anytime.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCustomPresetName(`${activePreset.name} (Custom)`);
              setIsSaveModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-primary/20"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Custom Preset</span>
          </button>
        </div>
      )}

      {/* Stacked Horizontal Studio Cards */}
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
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
            className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setIsSaveModalOpen(false)}
          >
          <div
            className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Save Custom Preset Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This will save your custom KB ceilings, proportions, and document settings to browser memory (localStorage). You can select it anytime under the "My Custom" tab.
            </p>

            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Preset Profile Name
                </label>
                <input
                  type="text"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  placeholder="e.g., State Scholarship Package 2026"
                  required
                  autoFocus
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveSuccess}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20"
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

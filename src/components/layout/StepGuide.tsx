import React from 'react';
import { Settings2, UploadCloud, FileCheck } from 'lucide-react';
import { useDossierStore } from '../../store/useDossierStore';
import { usePresetStore } from '../../store/usePresetStore';

export const StepGuide: React.FC = () => {
  const { photoSlot, signatureSlot, documentSlot, activeMode } = useDossierStore();
  const activePreset = usePresetStore((s) => s.getActivePreset());

  const hasAnyUpload = !!(photoSlot.file || signatureSlot.file || documentSlot.file);
  const isAllValid =
    (photoSlot.status === 'valid' || !activePreset.slots.photo) &&
    (signatureSlot.status === 'valid' || !activePreset.slots.signature) &&
    (documentSlot.status === 'valid' || !activePreset.slots.document);

  return (
    <nav aria-label="Workflow progress" className="w-full max-w-5xl mx-auto px-4 py-1">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Step 1 */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border shadow-card text-foreground">
          <div className="w-9 h-9 rounded-xl bg-primary-soft border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            1
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold uppercase tracking-wider">
              <Settings2 className="w-3.5 h-3.5" /> Selected Portal
            </div>
            <div className="text-sm font-bold text-foreground truncate">
              {activeMode === 'sandbox' ? 'Multi-Batch Sandbox' : activePreset.name}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div
          className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
            hasAnyUpload
              ? 'bg-card border-primary/40 shadow-card text-foreground'
              : 'bg-card/60 border-border text-muted-foreground'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
              hasAnyUpload
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <UploadCloud className="w-3.5 h-3.5" /> Drop Files
            </div>
            <div className="text-sm font-semibold text-foreground truncate">
              {hasAnyUpload ? 'Files Auto-Aligning' : 'Drop Camera Photos / PDF'}
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div
          className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
            isAllValid && hasAnyUpload
              ? 'bg-primary-soft border-primary/40 text-primary shadow-card'
              : 'bg-card/60 border-border text-muted-foreground'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
              isAllValid && hasAnyUpload
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            3
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileCheck className="w-3.5 h-3.5" /> Export Dossier
            </div>
            <div className="text-sm font-semibold truncate text-foreground">
              {isAllValid && hasAnyUpload ? '1-Click Verified ZIP Ready' : 'Download Verified Pack'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default StepGuide;

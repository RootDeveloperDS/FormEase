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
    <nav aria-label="Workflow progress" className="w-full max-w-5xl mx-auto px-4 py-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Step 1 */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
            1
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              <Settings2 className="w-3.5 h-3.5" /> Selected Portal
            </div>
            <div className="text-sm font-bold text-slate-100 truncate">
              {activeMode === 'sandbox' ? 'Multi-Batch Sandbox' : activePreset.name}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div
          className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
            hasAnyUpload
              ? 'bg-slate-900/80 border-emerald-500/30 text-slate-200'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
              hasAnyUpload
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            2
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <UploadCloud className="w-3.5 h-3.5" /> Drop Files
            </div>
            <div className="text-sm font-semibold text-slate-200 truncate">
              {hasAnyUpload ? 'Files Auto-Aligning' : 'Drop Camera Photos / PDF'}
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div
          className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
            isAllValid && hasAnyUpload
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
              isAllValid && hasAnyUpload
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            3
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <FileCheck className="w-3.5 h-3.5" /> Export Dossier
            </div>
            <div className="text-sm font-semibold truncate">
              {isAllValid && hasAnyUpload ? '1-Click Verified ZIP Ready' : 'Download Verified Pack'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

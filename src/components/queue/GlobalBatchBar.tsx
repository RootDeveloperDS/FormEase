import React, { useState } from 'react';
import { Layers, Zap, Trash2, ArrowDownToLine, SlidersHorizontal } from 'lucide-react';
import { useDossierStore } from '../../store/useDossierStore';
import { ActionButton } from '../common/ActionButton';

interface GlobalBatchBarProps {
  onOpenExportModal: () => void;
}

export const GlobalBatchBar: React.FC<GlobalBatchBarProps> = ({ onOpenExportModal }) => {
  const { sandboxQueue, batchApplySandboxTarget, clearAllSandbox } = useDossierStore();
  const [batchTargetKB, setBatchTargetKB] = useState(50);
  const [isApplying, setIsApplying] = useState(false);

  const handleBatchApply = async () => {
    setIsApplying(true);
    try {
      await batchApplySandboxTarget(batchTargetKB);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            Global Batch Control Bar
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {sandboxQueue.length} files
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Apply uniform compression ceilings across all queued files in 1 click
          </p>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Ceiling:</span>
          <input
            type="number"
            min="10"
            max="10000"
            value={batchTargetKB}
            onChange={(e) => setBatchTargetKB(Number(e.target.value))}
            className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-emerald-400 font-bold"
          />
          <span className="text-xs text-slate-400">KB</span>
        </div>

        <button
          type="button"
          onClick={handleBatchApply}
          disabled={isApplying || sandboxQueue.length === 0}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" /> Apply to All Cards
        </button>

        <ActionButton
          onClick={onOpenExportModal}
          disabled={sandboxQueue.length === 0}
          variant="primary"
          size="sm"
          leftIcon={<ArrowDownToLine className="w-3.5 h-3.5" />}
        >
          Download Verified Dossier (.ZIP)
        </ActionButton>

        <button
          type="button"
          onClick={clearAllSandbox}
          disabled={sandboxQueue.length === 0}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700/60 disabled:opacity-40"
          title="Clear queue"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

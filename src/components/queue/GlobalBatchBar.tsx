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
  const [batchWidth, setBatchWidth] = useState<number>(350);
  const [batchHeight, setBatchHeight] = useState<number>(350);
  const [applyDimensions, setApplyDimensions] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleBatchApply = async () => {
    setIsApplying(true);
    try {
      await batchApplySandboxTarget(
        batchTargetKB,
        undefined,
        applyDimensions ? { width: batchWidth, height: batchHeight } : undefined
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
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
            Apply uniform compression ceilings and pixel dimensions across all files in 1 click
          </p>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Batch Ceiling */}
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

        {/* Optional Batch Dimensions Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={applyDimensions}
              onChange={(e) => setApplyDimensions(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>Batch Dims:</span>
          </label>
          {applyDimensions && (
            <div className="flex items-center gap-1 font-mono text-xs">
              <input
                type="number"
                min="50"
                max="4000"
                value={batchWidth}
                onChange={(e) => setBatchWidth(Number(e.target.value))}
                className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                placeholder="W"
              />
              <span className="text-slate-500">×</span>
              <input
                type="number"
                min="50"
                max="4000"
                value={batchHeight}
                onChange={(e) => setBatchHeight(Number(e.target.value))}
                className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                placeholder="H"
              />
              <span className="text-[10px] text-slate-400">px</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleBatchApply}
          disabled={isApplying || sandboxQueue.length === 0}
          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-emerald-500/20"
        >
          <Zap className="w-3.5 h-3.5" /> Apply to All Cards
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

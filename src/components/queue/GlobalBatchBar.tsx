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
    <div className="p-4 rounded-3xl bg-card border border-border shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            Global Batch Control Bar
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground font-mono">
              {sandboxQueue.length} files
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Apply uniform compression ceilings and pixel dimensions across all files in 1 click
          </p>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Batch Ceiling */}
        <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-xl border border-border">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Ceiling:</span>
          <input
            type="number"
            min="10"
            max="10000"
            value={batchTargetKB}
            onChange={(e) => setBatchTargetKB(Number(e.target.value))}
            className="w-16 bg-card border border-border rounded px-2 py-0.5 text-xs font-mono text-primary font-bold"
          />
          <span className="text-xs text-muted-foreground">KB</span>
        </div>

        {/* Optional Batch Dimensions Toggle */}
        <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-xl border border-border text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-foreground select-none">
            <input
              type="checkbox"
              checked={applyDimensions}
              onChange={(e) => setApplyDimensions(e.target.checked)}
              className="accent-primary rounded"
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
                className="w-14 bg-card border border-border rounded px-1.5 py-0.5 text-center text-foreground"
                placeholder="W"
              />
              <span className="text-muted-foreground">×</span>
              <input
                type="number"
                min="50"
                max="4000"
                value={batchHeight}
                onChange={(e) => setBatchHeight(Number(e.target.value))}
                className="w-14 bg-card border border-border rounded px-1.5 py-0.5 text-center text-foreground"
                placeholder="H"
              />
              <span className="text-[10px] text-muted-foreground">px</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleBatchApply}
          disabled={isApplying || sandboxQueue.length === 0}
          className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-md transition-all"
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
          className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive-soft border border-border disabled:opacity-40 transition-colors"
          title="Clear queue"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

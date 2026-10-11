import React, { useState } from 'react';
import { Trash2, ArrowDownToLine, RefreshCw, FileText, Image as ImageIcon, Sliders } from 'lucide-react';
import { useDossierStore } from '../../store/useDossierStore';
import { formatBytes, formatDimensions } from '../../utils/byteFormatter';
import { ByteCounter } from '../common/ByteCounter';
import { StatusBadge } from '../common/StatusBadge';
import { MultiDropzone } from './MultiDropzone';
import { GlobalBatchBar } from './GlobalBatchBar';
import { saveAs } from '../../utils/fileSaver';
import { DiffViewer } from '../canvas/DiffViewer';

interface SandboxQueueViewProps {
  onOpenExportModal: () => void;
}

export const SandboxQueueView: React.FC<SandboxQueueViewProps> = ({ onOpenExportModal }) => {
  const {
    sandboxQueue,
    addSandboxFiles,
    removeSandboxCard,
    updateSandboxCardTarget,
    updateSandboxCardFilters,
    optimizeSandboxCard,
  } = useDossierStore();

  const [activeDiffCardId, setActiveDiffCardId] = useState<string | null>(null);

  const activeDiffCard = sandboxQueue.find((c) => c.id === activeDiffCardId);

  const handleDownloadCard = (card: any) => {
    if (!card.processedBlob) return;
    const ext = card.format === 'application/pdf' ? 'pdf' : card.format === 'image/png' ? 'png' : 'jpg';
    const cleanName = card.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const kb = Math.round(card.processedBytes / 1024);
    saveAs(card.processedBlob, `${cleanName}_${kb}KB.${ext}`);
  };

  return (
    <div className="space-y-6">
      {/* Global Batch Controls */}
      <GlobalBatchBar onOpenExportModal={onOpenExportModal} />

      {/* Universal Dropzone */}
      <MultiDropzone
        onFilesSelected={(files) => addSandboxFiles(files)}
        title="Add files to custom batch queue"
        description="Drop JPG, PNG, WebP photos or PDF documents. Each file gets an independent near-ceiling optimizer."
      />

      {/* Queue Cards Grid */}
      {sandboxQueue.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sandboxQueue.map((card) => (
            <div
              key={card.id}
              className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    {card.isPdf ? (
                      <FileText className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate" title={card.name}>
                      {card.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Raw: {formatBytes(card.sourceBytes)}
                    </span>
                  </div>
                </div>
                <StatusBadge status={card.status} />
              </div>

              {/* Card Preview Stage */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[160px] p-2 mb-3">
                {card.processedDataUrl ? (
                  card.isPdf ? (
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <FileText className="w-10 h-10 text-yellow-400 mb-1" />
                      <span className="text-xs font-bold text-slate-200">PDF Document</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatBytes(card.processedBytes)}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={card.processedDataUrl}
                      alt={card.name}
                      className="max-h-[140px] w-auto object-contain rounded-md shadow-sm"
                    />
                  )
                ) : (
                  <div className="text-xs text-slate-500 animate-pulse">Processing...</div>
                )}

                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
                  {formatDimensions(card.processedWidth, card.processedHeight)}
                </div>
              </div>

              {/* Target Ceiling Slider & Input */}
              <div className="space-y-3 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Target Ceiling:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="5"
                      max="10000"
                      value={card.targetMaxKB}
                      onChange={(e) => {
                        updateSandboxCardTarget(card.id, { targetMaxKB: Number(e.target.value) });
                      }}
                      onBlur={() => optimizeSandboxCard(card.id)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-right font-mono font-bold text-emerald-400"
                    />
                    <span className="text-slate-400 font-mono">KB</span>
                  </div>
                </div>

                <ByteCounter
                  currentBytes={card.processedBytes}
                  targetMaxBytes={card.targetMaxKB * 1024}
                  bracketPercentage={card.bracketPercentage}
                />
              </div>

              {/* Filter checkboxes */}
              <div className="flex items-center justify-between py-2 border-t border-slate-800 text-[11px] text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={card.filters.grayscale}
                    onChange={(e) => {
                      updateSandboxCardFilters(card.id, { grayscale: e.target.checked });
                      optimizeSandboxCard(card.id);
                    }}
                    className="rounded accent-emerald-500"
                  />
                  Grayscale
                </label>

                <button
                  type="button"
                  onClick={() => setActiveDiffCardId(card.id)}
                  disabled={!card.sourceUrl || card.isPdf}
                  className="hover:text-blue-400 disabled:opacity-40 flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" /> A/B Diff
                </button>

                <button
                  type="button"
                  onClick={() => optimizeSandboxCard(card.id)}
                  className="hover:text-emerald-400 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Re-run
                </button>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => removeSandboxCard(card.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadCard(card)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-500/30"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" /> Save File
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* A/B Diff Inspector Modal for Sandbox Card */}
      {activeDiffCard && activeDiffCard.sourceUrl && activeDiffCard.processedDataUrl && (
        <DiffViewer
          originalUrl={activeDiffCard.sourceUrl}
          originalBytes={activeDiffCard.sourceBytes}
          compressedUrl={activeDiffCard.processedDataUrl}
          compressedBytes={activeDiffCard.processedBytes}
          title={activeDiffCard.name}
          onClose={() => setActiveDiffCardId(null)}
        />
      )}
    </div>
  );
};

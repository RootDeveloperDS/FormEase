import React, { useState } from 'react';
import {
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Sliders,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDossierStore } from '../../store/useDossierStore';
import { formatBytes, formatDimensions } from '../../utils/byteFormatter';
import { ByteCounter } from '../common/ByteCounter';
import { StatusBadge } from '../common/StatusBadge';
import { SizeCeilingController } from '../common/SizeCeilingController';
import { PixelDimensionController } from '../common/PixelDimensionController';
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
  const [openDimCardId, setOpenDimCardId] = useState<string | null>(null);

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
              className="flex flex-col bg-card border border-border text-card-foreground rounded-3xl p-5 shadow-card relative overflow-hidden group hover:border-primary/40 transition-colors"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground shrink-0">
                    {card.isPdf ? (
                      <FileText className="w-4 h-4 text-amber-500" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate" title={card.name}>
                      {card.name}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Raw: {formatBytes(card.sourceBytes)}
                    </span>
                  </div>
                </div>
                <StatusBadge status={card.status} />
              </div>

              {/* Card Preview Stage */}
              <div className="relative rounded-2xl overflow-hidden bg-muted/40 border border-border flex items-center justify-center min-h-[160px] p-2 mb-3 shadow-inner">
                {card.processedDataUrl ? (
                  <div className="relative flex items-center justify-center w-full h-full">
                    <img
                      src={card.processedDataUrl}
                      alt={card.name}
                      className="max-h-[140px] w-auto object-contain rounded-md shadow-sm"
                    />
                    {card.isPdf && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/40 text-[9px] font-bold">
                        PDF
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground animate-pulse">Processing...</div>
                )}

                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-card/90 border border-border text-[10px] font-mono text-foreground backdrop-blur-sm shadow-sm">
                  {formatDimensions(card.processedWidth, card.processedHeight)}
                </div>
              </div>

              {/* Target Ceiling & Dimension Controls */}
              <div className="space-y-2.5 mb-3">
                <SizeCeilingController
                  currentKB={card.targetMaxKB}
                  defaultKB={100}
                  minKB={5}
                  maxKB={5000}
                  presets={[20, 50, 100, 200]}
                  accentColor="emerald"
                  label="Target Ceiling"
                  onChange={(kb) => {
                    updateSandboxCardTarget(card.id, { targetMaxKB: kb });
                    optimizeSandboxCard(card.id);
                  }}
                />

                {/* Dimension Expand Toggle */}
                <div className="border border-border rounded-xl overflow-hidden bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setOpenDimCardId(openDimCardId === card.id ? null : card.id)}
                    className="w-full p-2 text-xs flex items-center justify-between text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                      <Maximize2 className="w-3 h-3 text-primary" />
                      Dimensions: <span className="font-mono text-primary">{card.targetWidth}×{card.targetHeight} px</span>
                    </span>
                    {openDimCardId === card.id ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>

                  {openDimCardId === card.id && (
                    <div className="p-2 pt-0 border-t border-border animate-in fade-in duration-150">
                      <PixelDimensionController
                        width={card.targetWidth}
                        height={card.targetHeight}
                        defaultWidth={card.sourceWidth || 800}
                        defaultHeight={card.sourceHeight || 800}
                        slotType={card.isPdf ? 'document' : 'general'}
                        accentColor="emerald"
                        onChange={({ width, height, aspectRatio }) => {
                          updateSandboxCardTarget(card.id, {
                            targetWidth: width,
                            targetHeight: height,
                            aspectRatio,
                          });
                          optimizeSandboxCard(card.id);
                        }}
                      />
                    </div>
                  )}
                </div>

                <ByteCounter
                  currentBytes={card.processedBytes}
                  targetMaxBytes={card.targetMaxKB * 1024}
                  bracketPercentage={card.bracketPercentage}
                />
              </div>

              {/* Filter checkboxes */}
              <div className="flex items-center justify-between py-2 border-t border-border text-[11px] text-muted-foreground">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={card.filters.grayscale}
                    onChange={(e) => {
                      updateSandboxCardFilters(card.id, { grayscale: e.target.checked });
                      optimizeSandboxCard(card.id);
                    }}
                    className="rounded accent-primary"
                  />
                  Grayscale
                </label>

                <button
                  type="button"
                  onClick={() => setActiveDiffCardId(card.id)}
                  disabled={!card.sourceUrl || card.isPdf}
                  className="hover:text-primary disabled:opacity-40 flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" /> A/B Diff
                </button>

                <button
                  type="button"
                  onClick={() => optimizeSandboxCard(card.id)}
                  className="hover:text-primary flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Re-run
                </button>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => removeSandboxCard(card.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive-soft"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadCard(card)}
                  className="px-3 py-1.5 rounded-xl bg-primary-soft hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 border border-primary/30 transition-colors"
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

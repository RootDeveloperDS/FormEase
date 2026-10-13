import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Upload,
  Eye,
  ArrowDownToLine,
  Trash2,
  RefreshCw,
  FileCheck,
  BookmarkPlus,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useDossierStore } from '../../../store/useDossierStore';
import { usePresetStore } from '../../../store/usePresetStore';
import { formatBytes, formatDimensions } from '../../../utils/byteFormatter';
import { ByteCounter } from '../../common/ByteCounter';
import { StatusBadge } from '../../common/StatusBadge';
import { SizeCeilingController } from '../../common/SizeCeilingController';
import { PixelDimensionController } from '../../common/PixelDimensionController';
import { saveAs } from '../../../utils/fileSaver';
import { getStandardizedFileName } from '../../../utils/zipBundler';
import { generateSampleDocumentBlob } from '../../../utils/sampleDataGenerator';

export const DocumentSlotCard: React.FC = () => {
  const {
    documentSlot,
    setSlotFile,
    clearSlot,
    updateSlotFilters,
    updateSlotTarget,
    resetSlotCustomTarget,
    optimizeSlot,
    saveCurrentAsCustomPreset,
  } = useDossierStore();

  const activePreset = usePresetStore((s) => s.getActivePreset());
  const requirement = activePreset.slots.document;

  // Local UI states
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [tweakMaxKB, setTweakMaxKB] = useState<number>(
    documentSlot.customTargetMaxKB || (requirement ? Math.round(requirement.targetMaxBytes / 1024) : 200)
  );
  const [tweakWidth, setTweakWidth] = useState<number>(
    documentSlot.customWidth || (requirement ? requirement.width : 1240)
  );
  const [tweakHeight, setTweakHeight] = useState<number>(
    documentSlot.customHeight || (requirement ? requirement.height : 1754)
  );
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const handleLoadSample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsLoadingSample(true);
    try {
      const file = await generateSampleDocumentBlob();
      await setSlotFile('document', file);
    } catch (err) {
      console.error('Failed to load sample document:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  useEffect(() => {
    if (requirement) {
      setTweakMaxKB(
        documentSlot.customTargetMaxKB || Math.round(requirement.targetMaxBytes / 1024)
      );
      setTweakWidth(documentSlot.customWidth || requirement.width);
      setTweakHeight(documentSlot.customHeight || requirement.height);
    }
  }, [documentSlot.customTargetMaxKB, documentSlot.customWidth, documentSlot.customHeight, requirement]);

  if (!requirement) return null;

  const targetMaxBytes = documentSlot.customTargetMaxKB
    ? documentSlot.customTargetMaxKB * 1024
    : requirement.targetMaxBytes;
  const isPdfOutput = requirement.defaultFormat === 'application/pdf';

  // File Handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSlotFile('document', e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSlotFile('document', e.target.files[0]);
    }
  };

  const handleSaveSingle = () => {
    if (!documentSlot.processedBlob) return;
    const item = {
      id: 'document',
      slotType: 'document' as const,
      title: requirement.title,
      originalFileName: documentSlot.file?.name || (isPdfOutput ? 'document.pdf' : 'document.jpg'),
      blob: documentSlot.processedBlob,
      finalBytes: documentSlot.processedBytes,
      targetMaxBytes,
      width: documentSlot.processedWidth || 1200,
      height: documentSlot.processedHeight || 1600,
      mimeType: documentSlot.mimeType,
      passed: documentSlot.status === 'valid',
    };
    const fileName = getStandardizedFileName(item, 2);
    saveAs(documentSlot.processedBlob, fileName);
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPresetName.trim()) return;
    saveCurrentAsCustomPreset(customPresetName);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSavePresetModalOpen(false);
      setCustomPresetName('');
    }, 1200);
  };

  const isRawOverLimit = documentSlot.file ? documentSlot.sourceBytes > targetMaxBytes : false;

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all justify-between min-h-[490px]">
      <div>
        {/* Clean, Premium Header: Uncluttered, Spacious, Zero Noise */}
        <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 truncate">Slot 3: Document</h3>
                {documentSlot.customTargetMaxKB && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Official target: &lt; {Math.round(targetMaxBytes / 1024)} KB • {isPdfOutput ? 'Compliant PDF' : 'JPEG Scan'}
              </p>
            </div>
          </div>
        </div>



        {/* Slot Body: Empty State vs Loaded Preview */}
        {documentSlot.file ? (
          <div className="space-y-3">
            {/* Consolidated Before/After & Official Validation Strip */}
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-slate-400 font-medium text-[11px] shrink-0">Raw:</span>
                <span
                  className={`font-mono text-xs font-bold shrink-0 ${
                    isRawOverLimit ? 'text-rose-400' : 'text-slate-300'
                  }`}
                >
                  {formatBytes(documentSlot.sourceBytes)}
                </span>
                {isRawOverLimit ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 flex items-center gap-1 shadow-sm shadow-rose-500/20 shrink-0">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    {'>'}{Math.round(targetMaxBytes / 1024)} KB
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 shrink-0">
                    OK
                  </span>
                )}
              </div>

              <span className="text-slate-600 font-bold shrink-0 px-1">➔</span>

              <div className="flex items-center gap-1.5 min-w-0">
                {/* <span className="text-slate-400 font-medium text-[11px] shrink-0">Ready:</span> */}
                <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                  {formatBytes(documentSlot.processedBytes)}
                </span>
                {documentSlot.sourceBytes > documentSlot.processedBytes && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    -{Math.round((1 - documentSlot.processedBytes / documentSlot.sourceBytes) * 100)}%
                  </span>
                )}
              </div>

              <div className="shrink-0 pl-1">
                <StatusBadge status={documentSlot.status} label={documentSlot.status === 'valid' ? ' ' : undefined} />
              </div>
            </div>

            {/* 1:1 Visual Preview Stage */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center h-52 group/preview shadow-md p-2">
              {isHoldingOriginal && !documentSlot.isPdf ? (
                /* Raw Scanned Document Image */
                <img
                  src={documentSlot.sourceUrl || ''}
                  alt="Raw uploaded marksheet scan"
                  className="max-h-48 w-auto object-contain rounded-md"
                />
              ) : documentSlot.processedDataUrl ? (
                /* 1:1 Real Rendered Document Page Preview (for both PDF & Images) */
                <div className="relative flex items-center justify-center w-full h-full">
                  <img
                    src={documentSlot.processedDataUrl}
                    alt="Processed document preview with legible text"
                    className="max-h-48 w-auto object-contain rounded-md shadow-sm border border-slate-800"
                  />
                  {isPdfOutput && (
                    <div className="absolute top-1 left-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <FileCheck className="w-3 h-3 text-amber-400" /> PDF Output
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 animate-pulse">Rendering document page...</div>
              )}

              {/* Dimension / Format Badge */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
                {isPdfOutput ? 'Standard A4 PDF' : formatDimensions(documentSlot.processedWidth || 1200, documentSlot.processedHeight || 1600)}
              </div>

              {/* Hold to Compare Floating Button (for image uploads) */}
              {documentSlot.sourceUrl && !documentSlot.isPdf && (
                <button
                  type="button"
                  onMouseDown={() => setIsHoldingOriginal(true)}
                  onMouseUp={() => setIsHoldingOriginal(false)}
                  onMouseLeave={() => setIsHoldingOriginal(false)}
                  onTouchStart={() => setIsHoldingOriginal(true)}
                  onTouchEnd={() => setIsHoldingOriginal(false)}
                  className="absolute top-2 right-2 px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 shadow-sm select-none"
                  title="Hold to see original color scan"
                >
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span>{isHoldingOriginal ? 'Original Scan' : 'Hold to Diff'}</span>
                </button>
              )}
            </div>

            {/* Live Precision Byte Counter */}
            <ByteCounter
              currentBytes={documentSlot.processedBytes}
              targetMaxBytes={targetMaxBytes}
              targetMinBytes={requirement.targetMinBytes}
              bracketPercentage={documentSlot.bracketPercentage}
            />

            {/* In-Place Tactile Document Controls */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Document Enhancement Engine
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Grayscale Pill Toggle */}
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={documentSlot.filters.grayscale}
                    onChange={(e) => {
                      updateSlotFilters('document', { grayscale: e.target.checked });
                      optimizeSlot('document');
                    }}
                    className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">Black & White</span>
                    <span className="text-[10px] text-emerald-400 block">-60% file size</span>
                  </div>
                </label>

                {/* Text Sharpening Pill Toggle */}
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={documentSlot.filters.sharpenText}
                    onChange={(e) => {
                      updateSlotFilters('document', { sharpenText: e.target.checked });
                      optimizeSlot('document');
                    }}
                    className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">Sharpen Text</span>
                    <span className="text-[10px] text-slate-400 block">Clear & readable</span>
                  </div>
                </label>
              </div>

              {/* Direct Target Max Size Selector */}
              <SizeCeilingController
                currentKB={tweakMaxKB}
                defaultKB={requirement ? Math.round(requirement.targetMaxBytes / 1024) : 200}
                minKB={10}
                maxKB={5000}
                presets={[
                  { kb: 100, badge: 'Compact' },
                  { kb: 200, badge: 'Standard' },
                  { kb: 300, badge: 'Crisp' },
                  { kb: 500, badge: 'Max' },
                ]}
                accentColor="amber"
                label="Document Size Limit"
                onChange={(kb) => {
                  setTweakMaxKB(kb);
                  updateSlotTarget('document', { maxKB: kb });
                }}
                onReset={() => resetSlotCustomTarget('document')}
                showReset={!!documentSlot.customTargetMaxKB}
              />

              {/* Pixel Dimension Controller for Document */}
              <PixelDimensionController
                width={tweakWidth}
                height={tweakHeight}
                defaultWidth={requirement.width}
                defaultHeight={requirement.height}
                defaultRatio={requirement.aspectRatio}
                slotType="document"
                accentColor="amber"
                onChange={({ width, height, aspectRatio, aspectRatioValue }) => {
                  setTweakWidth(width);
                  setTweakHeight(height);
                  updateSlotTarget('document', {
                    width,
                    height,
                    aspectRatio,
                    aspectRatioValue,
                  });
                }}
                onReset={() => {
                  setTweakWidth(requirement.width);
                  setTweakHeight(requirement.height);
                  updateSlotTarget('document', {
                    width: requirement.width,
                    height: requirement.height,
                    aspectRatio: requirement.aspectRatio,
                    aspectRatioValue: requirement.aspectRatioValue,
                  });
                }}
                showReset={
                  tweakWidth !== requirement.width || tweakHeight !== requirement.height
                }
              />

              {/* Bookmark Save Action */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-900 text-[11px]">
                <span className="text-slate-400">Save custom configuration:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomPresetName(`${activePreset.name} (Doc ${tweakMaxKB}KB • ${tweakWidth}×${tweakHeight})`);
                    setIsSavePresetModalOpen(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30"
                >
                  <BookmarkPlus className="w-3 h-3" /> Save to My Presets
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Studio Canvas Dropzone */
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl hover:border-amber-500/40 hover:bg-amber-950/10 transition-colors cursor-pointer text-center group"
          >
            <label className="cursor-pointer flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 transition-transform group-hover:scale-105 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400">
                Drop PDF or scanned marksheet/certificate
              </span>
              <span className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                Auto-formats to &lt; {formatBytes(targetMaxBytes)} • {isPdfOutput ? 'Single-Page PDF' : 'JPEG Document'}
              </span>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isLoadingSample}
              className="mt-1 mb-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isLoadingSample ? 'Generating sample...' : '✨ Try Sample Document'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Slot Footer */}
      {documentSlot.file && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
          <label className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Replace Document
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => clearSlot('document')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
              title="Remove document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSaveSingle}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 border border-amber-500/30 shadow-sm"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" /> Save {isPdfOutput ? 'PDF' : 'Doc'}
            </button>
          </div>
        </div>
      )}

      {/* Save Custom Preset Modal */}
      {isSavePresetModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setIsSavePresetModalOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <BookmarkPlus className="w-4 h-4 text-amber-400" /> Save as Custom Preset
                </h4>
                <button
                  type="button"
                  onClick={() => setIsSavePresetModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Save your custom {tweakMaxKB} KB document limit so you can instantly re-use it anytime.
              </p>
              <form onSubmit={handleSavePreset} className="space-y-3">
                <input
                  type="text"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  placeholder="e.g., My UPSC 300KB Document"
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSavePresetModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    {saveSuccess ? 'Saved!' : 'Save Preset'}
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

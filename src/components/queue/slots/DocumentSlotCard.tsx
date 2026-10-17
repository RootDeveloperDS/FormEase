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
  ChevronDown,
  ChevronUp,
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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

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
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden group hover:border-slate-700/80 transition-all">
      {/* Clean, Premium Header: Uncluttered, Spacious, with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 tracking-tight">Slot 3: Document</h3>
              {documentSlot.customTargetMaxKB && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
                  Custom
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">
              Official target: &lt; {Math.round(targetMaxBytes / 1024)} KB • {tweakWidth}×{tweakHeight} px • {isPdfOutput ? 'Compliant PDF' : 'JPEG Scan'}
            </p>
          </div>
        </div>

        {/* Top Right Slot Actions (when file exists) */}
        {documentSlot.file && (
          <div className="flex items-center gap-2">
            <StatusBadge status={documentSlot.status} label={documentSlot.status === 'valid' ? '100% Compliant' : undefined} />
            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
            <label className="text-xs font-semibold text-slate-300 hover:text-white cursor-pointer px-2.5 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 flex items-center gap-1.5 transition-all">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Replace</span>
              <input type="file" accept="application/pdf,image/*" onChange={handleFileInput} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => clearSlot('document')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Remove document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSaveSingle}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Save {isPdfOutput ? 'PDF' : 'Doc'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Studio Body: Loaded vs Empty State */}
      {documentSlot.file ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Visual Document Viewport (~42% on desktop) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* 1:1 Visual Preview Stage */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center h-60 group/preview shadow-md p-3">
              {isHoldingOriginal && !documentSlot.isPdf ? (
                <img
                  src={documentSlot.sourceUrl || ''}
                  alt="Raw uploaded marksheet scan"
                  className="max-h-52 w-auto object-contain rounded-md"
                />
              ) : documentSlot.processedDataUrl ? (
                <div className="relative flex items-center justify-center w-full h-full">
                  <img
                    src={documentSlot.processedDataUrl}
                    alt="Processed document preview with legible text"
                    className="max-h-52 w-auto object-contain rounded-md shadow-sm border border-slate-800"
                  />
                  {isPdfOutput && (
                    <div className="absolute top-1 left-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
                      <FileCheck className="w-3.5 h-3.5 text-amber-400" /> PDF Output
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 animate-pulse">Rendering document page...</div>
              )}

              {/* Dimension / Format Badge */}
              <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-[11px] font-mono font-semibold text-slate-300 shadow-sm">
                {isPdfOutput ? 'Standard A4 PDF' : formatDimensions(documentSlot.processedWidth || 1200, documentSlot.processedHeight || 1600)}
              </div>

              {/* Hold to Compare Floating Button */}
              {documentSlot.sourceUrl && !documentSlot.isPdf && (
                <button
                  type="button"
                  onMouseDown={() => setIsHoldingOriginal(true)}
                  onMouseUp={() => setIsHoldingOriginal(false)}
                  onMouseLeave={() => setIsHoldingOriginal(false)}
                  onTouchStart={() => setIsHoldingOriginal(true)}
                  onTouchEnd={() => setIsHoldingOriginal(false)}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-sm select-none transition-all"
                  title="Hold to see original color scan"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isHoldingOriginal ? 'Original Scan' : 'Hold to Compare'}</span>
                </button>
              )}
            </div>

            {/* Document Enhancement Toggles */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Document Enhancement Engine
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Grayscale Pill Toggle */}
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer select-none transition-colors">
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
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer select-none transition-colors">
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
            </div>
          </div>

          {/* RIGHT COLUMN: Control Deck & Compliance Metrics (~58% on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Before ➔ After Compression Strip */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Original File:</span>
                <span
                  className={`font-mono font-bold ${
                    isRawOverLimit ? 'text-rose-400' : 'text-slate-300'
                  }`}
                >
                  {formatBytes(documentSlot.sourceBytes)}
                </span>
                {isRawOverLimit ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow-sm shadow-rose-500/20">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    Exceeds {Math.round(targetMaxBytes / 1024)} KB
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                    OK
                  </span>
                )}
              </div>

              <span className="text-slate-600 font-bold px-1 hidden sm:inline">➔</span>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Optimized:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatBytes(documentSlot.processedBytes)}
                </span>
                {documentSlot.sourceBytes > documentSlot.processedBytes && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    -{Math.round((1 - documentSlot.processedBytes / documentSlot.sourceBytes) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* 2. Live Precision Byte Counter */}
            <ByteCounter
              currentBytes={documentSlot.processedBytes}
              targetMaxBytes={targetMaxBytes}
              targetMinBytes={requirement.targetMinBytes}
              bracketPercentage={documentSlot.bracketPercentage}
            />

            {/* 3. Direct Target Max Size Selector */}
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

            {/* 4. Progressive Disclosure Accordion: Advanced Dimensions & Custom Presets */}
            <div className="border border-slate-800 rounded-2xl bg-slate-950/70 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>⚙️ Pixel Dimensions & Custom Overrides</span>
                  <span className="font-mono text-[11px] text-slate-400 font-normal">
                    ({tweakWidth}×{tweakHeight} px)
                  </span>
                </span>
                {isAdvancedOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isAdvancedOpen && (
                <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3.5 animate-in fade-in duration-150">
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
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                    <span className="text-slate-400">Save custom configuration:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPresetName(`${activePreset.name} (Doc ${tweakMaxKB}KB • ${tweakWidth}×${tweakHeight})`);
                        setIsSavePresetModalOpen(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 transition-colors"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" /> Save to My Presets
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty Studio Canvas Dropzone: Horizontal, Spacious, Welcoming */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 border-2 border-dashed border-slate-800 rounded-2xl hover:border-amber-500/40 hover:bg-amber-950/10 transition-all cursor-pointer group gap-4 text-center sm:text-left"
        >
          <label className="cursor-pointer flex flex-col sm:flex-row items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center transition-transform group-hover:scale-105 shadow-inner shrink-0">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors block">
                Drop PDF or scanned marksheet/certificate
              </span>
              <span className="text-xs text-slate-400 mt-1 block">
                Auto-formats to &lt; {formatBytes(targetMaxBytes)} • {isPdfOutput ? 'Compliant Single-Page PDF' : 'JPEG Document'}
              </span>
            </div>
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
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-slate-200 hover:text-amber-300 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isLoadingSample ? 'Generating sample...' : '✨ Try Sample Document'}</span>
          </button>
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

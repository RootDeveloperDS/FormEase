import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  PenLine,
  Upload,
  Eye,
  ArrowDownToLine,
  Trash2,
  RefreshCw,
  Wand2,
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
import { generateSampleSignatureBlob } from '../../../utils/sampleDataGenerator';

export const SignatureSlotCard: React.FC = () => {
  const {
    signatureSlot,
    setSlotFile,
    clearSlot,
    updateSlotFilters,
    updateSlotTarget,
    resetSlotCustomTarget,
    optimizeSlot,
    saveCurrentAsCustomPreset,
  } = useDossierStore();

  const activePreset = usePresetStore((s) => s.getActivePreset());
  const requirement = activePreset.slots.signature;

  // Local UI states
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local slider states for 0-latency smooth thumb movement without firing 100s of heavy filters
  const [localBleach, setLocalBleach] = useState<number>(signatureSlot.filters.bleachThreshold || 185);
  const [localDarkness, setLocalDarkness] = useState<number>(signatureSlot.filters.inkDarkness || 1.3);

  const [tweakMaxKB, setTweakMaxKB] = useState<number>(
    signatureSlot.customTargetMaxKB || (requirement ? Math.round(requirement.targetMaxBytes / 1024) : 20)
  );
  const [tweakWidth, setTweakWidth] = useState<number>(
    signatureSlot.customWidth || (requirement ? requirement.width : 280)
  );
  const [tweakHeight, setTweakHeight] = useState<number>(
    signatureSlot.customHeight || (requirement ? requirement.height : 120)
  );
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const handleLoadSample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsLoadingSample(true);
    try {
      const file = await generateSampleSignatureBlob();
      await setSlotFile('signature', file);
    } catch (err) {
      console.error('Failed to load sample signature:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Sync local sliders when slot file changes
  useEffect(() => {
    setLocalBleach(signatureSlot.filters.bleachThreshold || 185);
    setLocalDarkness(signatureSlot.filters.inkDarkness || 1.3);
  }, [signatureSlot.file]);

  // Debounced filter commit: only runs once when slider thumb motion pauses
  const debouncedCommitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitFiltersAndOptimize = useCallback(
    (threshold: number, darkness: number) => {
      if (debouncedCommitRef.current) {
        clearTimeout(debouncedCommitRef.current);
      }
      debouncedCommitRef.current = setTimeout(() => {
        updateSlotFilters('signature', {
          bleachThreshold: threshold,
          inkDarkness: darkness,
        });
        optimizeSlot('signature');
      }, 250);
    },
    [updateSlotFilters, optimizeSlot]
  );

  useEffect(() => {
    return () => {
      if (debouncedCommitRef.current) clearTimeout(debouncedCommitRef.current);
    };
  }, []);

  useEffect(() => {
    if (requirement) {
      setTweakMaxKB(
        signatureSlot.customTargetMaxKB || Math.round(requirement.targetMaxBytes / 1024)
      );
      setTweakWidth(signatureSlot.customWidth || requirement.width);
      setTweakHeight(signatureSlot.customHeight || requirement.height);
    }
  }, [signatureSlot.customTargetMaxKB, signatureSlot.customWidth, signatureSlot.customHeight, requirement]);

  if (!requirement) return null;

  const targetMaxBytes = signatureSlot.customTargetMaxKB
    ? signatureSlot.customTargetMaxKB * 1024
    : requirement.targetMaxBytes;
  const targetW = signatureSlot.customWidth || requirement.width;
  const targetH = signatureSlot.customHeight || requirement.height;

  // File Handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSlotFile('signature', e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSlotFile('signature', e.target.files[0]);
    }
  };

  const handleSaveSingle = () => {
    if (!signatureSlot.processedBlob) return;
    const item = {
      id: 'signature',
      slotType: 'signature' as const,
      title: requirement.title,
      originalFileName: signatureSlot.file?.name || 'signature.jpg',
      blob: signatureSlot.processedBlob,
      finalBytes: signatureSlot.processedBytes,
      targetMaxBytes,
      width: signatureSlot.processedWidth || targetW,
      height: signatureSlot.processedHeight || targetH,
      mimeType: signatureSlot.mimeType,
      passed: signatureSlot.status === 'valid',
    };
    const fileName = getStandardizedFileName(item, 1);
    saveAs(signatureSlot.processedBlob, fileName);
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

  // Quick preset filter button setter
  const applyPresetFilters = (threshold: number, darkness: number) => {
    setLocalBleach(threshold);
    setLocalDarkness(darkness);
    updateSlotFilters('signature', {
      bleachThreshold: threshold,
      inkDarkness: darkness,
    });
    optimizeSlot('signature');
  };

  const isRawOverLimit = signatureSlot.file ? signatureSlot.sourceBytes > targetMaxBytes : false;

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all justify-between min-h-[490px]">
      <div>
        {/* Clean, Premium Header: Uncluttered, Spacious, Zero Noise */}
        <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 shadow-sm">
              <PenLine className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 truncate">Slot 2: Signature</h3>
                {signatureSlot.customTargetMaxKB && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold shrink-0">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Official target: &lt; {Math.round(targetMaxBytes / 1024)} KB • {targetW}×{targetH} px
              </p>
            </div>
          </div>
        </div>



        {/* Slot Body: Empty State vs Loaded Preview */}
        {signatureSlot.file ? (
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
                  {formatBytes(signatureSlot.sourceBytes)}
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
                  {formatBytes(signatureSlot.processedBytes)}
                </span>
                {signatureSlot.sourceBytes > signatureSlot.processedBytes && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    -{Math.round((1 - signatureSlot.processedBytes / signatureSlot.sourceBytes) * 100)}%
                  </span>
                )}
              </div>

              <div className="shrink-0 pl-1">
                <StatusBadge status={signatureSlot.status} label={signatureSlot.status === 'valid' ? ' ' : undefined} />
              </div>
            </div>

            {/* 1:1 Output Preview Stage */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center h-52 group/preview shadow-md">
              {isHoldingOriginal ? (
                /* Raw Smartphone Photo */
                <img
                  src={signatureSlot.sourceUrl || ''}
                  alt="Raw uploaded signature"
                  className="max-h-48 w-auto object-contain rounded-lg"
                />
              ) : signatureSlot.processedDataUrl ? (
                /* 1:1 Clean Output */
                <img
                  src={signatureSlot.processedDataUrl}
                  alt="Clean signature on crisp white paper"
                  className="max-h-48 w-auto object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-xs text-slate-500 animate-pulse">Cleaning background ink...</div>
              )}

              {/* Badges on preview */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
                {formatDimensions(signatureSlot.processedWidth || targetW, signatureSlot.processedHeight || targetH)}
              </div>

              {/* Hold to Compare Floating Button */}
              {signatureSlot.sourceUrl && (
                <button
                  type="button"
                  onMouseDown={() => setIsHoldingOriginal(true)}
                  onMouseUp={() => setIsHoldingOriginal(false)}
                  onMouseLeave={() => setIsHoldingOriginal(false)}
                  onTouchStart={() => setIsHoldingOriginal(true)}
                  onTouchEnd={() => setIsHoldingOriginal(false)}
                  className="absolute top-2 right-2 px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 shadow-sm select-none"
                  title="Hold to see original phone camera photo"
                >
                  <Eye className="w-3 h-3 text-blue-400" />
                  <span>{isHoldingOriginal ? 'Raw Desk Photo' : 'Hold to Diff'}</span>
                </button>
              )}
            </div>

            {/* Live Precision Byte Counter */}
            <ByteCounter
              currentBytes={signatureSlot.processedBytes}
              targetMaxBytes={targetMaxBytes}
              targetMinBytes={requirement.targetMinBytes}
              bracketPercentage={signatureSlot.bracketPercentage}
            />

            {/* In-Place Tactile Paper & Ink Controls */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              {/* Quick Preset Action Pills */}
              <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-900">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Wand2 className="w-3 h-3 text-blue-400" /> Clean Paper & Ink
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyPresetFilters(185, 1.3)}
                    className="px-2 py-0.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-[10px] font-semibold"
                  >
                    White Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetFilters(210, 1.8)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium"
                  >
                    Bold Ink
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetFilters(120, 1.0)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-medium"
                  >
                    Original
                  </button>
                </div>
              </div>

              {/* Slider 1: Clean White Background */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Clean White Background:</span>
                  <span className="font-mono text-emerald-400 font-bold text-[11px]">
                    {localBleach} / 255
                  </span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="240"
                  step="1"
                  value={localBleach}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLocalBleach(val);
                    commitFiltersAndOptimize(val, localDarkness);
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Slider 2: Darken Pen Ink */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Darken Pen Ink:</span>
                  <span className="font-mono text-blue-400 font-bold text-[11px]">
                    {localDarkness.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.1"
                  value={localDarkness}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLocalDarkness(val);
                    commitFiltersAndOptimize(localBleach, val);
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Direct Target Max Size Selector */}
              <SizeCeilingController
                currentKB={tweakMaxKB}
                defaultKB={requirement ? Math.round(requirement.targetMaxBytes / 1024) : 20}
                minKB={5}
                maxKB={500}
                presets={[
                  { kb: 10, badge: 'Min' },
                  { kb: 20, badge: 'Standard' },
                  { kb: 30, badge: 'NTA' },
                  { kb: 50, badge: 'Govt' },
                ]}
                accentColor="blue"
                label="Signature Size Limit"
                onChange={(kb) => {
                  setTweakMaxKB(kb);
                  updateSlotTarget('signature', { maxKB: kb });
                }}
                onReset={() => resetSlotCustomTarget('signature')}
                showReset={!!signatureSlot.customTargetMaxKB}
              />

              {/* Pixel Dimension Controller for Signature */}
              <PixelDimensionController
                width={tweakWidth}
                height={tweakHeight}
                defaultWidth={requirement.width}
                defaultHeight={requirement.height}
                defaultRatio={requirement.aspectRatio}
                slotType="signature"
                accentColor="blue"
                onChange={({ width, height, aspectRatio, aspectRatioValue }) => {
                  setTweakWidth(width);
                  setTweakHeight(height);
                  updateSlotTarget('signature', {
                    width,
                    height,
                    aspectRatio,
                    aspectRatioValue,
                  });
                }}
                onReset={() => {
                  setTweakWidth(requirement.width);
                  setTweakHeight(requirement.height);
                  updateSlotTarget('signature', {
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
                    setCustomPresetName(`${activePreset.name} (Sig ${tweakMaxKB}KB • ${tweakWidth}×${tweakHeight})`);
                    setIsSavePresetModalOpen(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30"
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
            className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl hover:border-blue-500/40 hover:bg-blue-950/10 transition-colors cursor-pointer text-center group"
          >
            <label className="cursor-pointer flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 group-hover:bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 transition-transform group-hover:scale-105 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400">
                Drop photo of your handwritten signature
              </span>
              <span className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                Cleans desk shadows to pure white & keeps &lt; {formatBytes(targetMaxBytes)}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isLoadingSample}
              className="mt-1 mb-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{isLoadingSample ? 'Generating sample...' : '✨ Try Sample Signature'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Slot Footer */}
      {signatureSlot.file && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
          <label className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Replace Signature
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => clearSlot('signature')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
              title="Remove signature"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSaveSingle}
              className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1 border border-blue-500/30 shadow-sm"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" /> Save Signature
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
                  <BookmarkPlus className="w-4 h-4 text-blue-400" /> Save as Custom Preset
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
                Save your custom {tweakMaxKB} KB signature limit so you can instantly re-use it anytime.
              </p>
              <form onSubmit={handleSavePreset} className="space-y-3">
                <input
                  type="text"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  placeholder="e.g., My UPSC 20KB Signature"
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-400"
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
                    className="px-3 py-1.5 rounded-lg bg-blue-500 text-white font-bold text-xs"
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

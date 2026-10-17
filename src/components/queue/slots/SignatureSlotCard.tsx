import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  PenLine,
  Upload,
  Crop,
  Eye,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ArrowDownToLine,
  Trash2,
  RefreshCw,
  Wand2,
  BookmarkPlus,
  X,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDossierStore } from '../../../store/useDossierStore';
import type { CropState } from '../../../store/useDossierStore';
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
    updateSlotCrop,
    updateSlotFilters,
    updateSlotTarget,
    resetSlotCustomTarget,
    optimizeSlot,
    saveCurrentAsCustomPreset,
  } = useDossierStore();

  const activePreset = usePresetStore((s) => s.getActivePreset());
  const requirement = activePreset.slots.signature;

  // Local UI states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Local crop state for butter-smooth 120 FPS interaction with ZERO canvas resets
  const [localCrop, setLocalCrop] = useState<CropState>({
    zoom: signatureSlot.crop.zoom || 1.0,
    panX: signatureSlot.crop.panX || 0,
    panY: signatureSlot.crop.panY || 0,
    rotation: signatureSlot.crop.rotation || 0,
  });

  // Stage & Drag refs
  const stageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });
  const debouncedCropCommitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Sync local crop & sliders when slot file changes
  useEffect(() => {
    setLocalCrop({
      zoom: signatureSlot.crop.zoom || 1.0,
      panX: signatureSlot.crop.panX || 0,
      panY: signatureSlot.crop.panY || 0,
      rotation: signatureSlot.crop.rotation || 0,
    });
    setLocalBleach(signatureSlot.filters.bleachThreshold || 185);
    setLocalDarkness(signatureSlot.filters.inkDarkness || 1.3);
  }, [signatureSlot.file]);

  const commitCropAndOptimize = useCallback(
    (newCrop: CropState) => {
      if (debouncedCropCommitRef.current) {
        clearTimeout(debouncedCropCommitRef.current);
      }
      debouncedCropCommitRef.current = setTimeout(() => {
        updateSlotCrop('signature', newCrop);
        optimizeSlot('signature');
      }, 280);
    },
    [updateSlotCrop, optimizeSlot]
  );

  // Non-passive wheel listener: only active when user is in adjusting/crop mode (isEditorOpen)
  useEffect(() => {
    if (!isEditorOpen) return;
    const el = containerRef.current || stageRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      setLocalCrop((prev) => {
        const nextZoom = Math.min(3.5, Math.max(0.6, Math.round((prev.zoom + delta) * 100) / 100));
        const updated = { ...prev, zoom: nextZoom };
        commitCropAndOptimize(updated);
        return updated;
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isEditorOpen, commitCropAndOptimize]);

  // Pointer Drag Handlers (120 FPS GPU-accelerated motion with ZERO blanking)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isEditorOpen) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: localCrop.panX,
      startPanY: localCrop.panY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isEditorOpen) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const nextPanX = Math.round(dragStartRef.current.startPanX + dx);
    const nextPanY = Math.round(dragStartRef.current.startPanY + dy);
    setLocalCrop((prev) => ({ ...prev, panX: nextPanX, panY: nextPanY }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      commitCropAndOptimize(localCrop);
    }
  };

  // Keyboard Nudge Handlers (1px default, 10px with Shift)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditorOpen) return;
    const step = e.shiftKey ? 10 : 1;
    let handled = false;
    let nextPanX = localCrop.panX;
    let nextPanY = localCrop.panY;

    if (e.key === 'ArrowUp') {
      nextPanY -= step;
      handled = true;
    } else if (e.key === 'ArrowDown') {
      nextPanY += step;
      handled = true;
    } else if (e.key === 'ArrowLeft') {
      nextPanX -= step;
      handled = true;
    } else if (e.key === 'ArrowRight') {
      nextPanX += step;
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      const updated = { ...localCrop, panX: nextPanX, panY: nextPanY };
      setLocalCrop(updated);
      commitCropAndOptimize(updated);
    }
  };

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
      if (debouncedCropCommitRef.current) clearTimeout(debouncedCropCommitRef.current);
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

  const containerMaxW = 280;
  const containerMaxH = 192;
  const maxBoxAspect = containerMaxW / containerMaxH;
  const aspectRatioVal = Math.max(0.01, targetW / targetH);

  let stageWidth: number;
  let stageHeight: number;

  if (aspectRatioVal >= maxBoxAspect) {
    stageWidth = containerMaxW;
    stageHeight = Math.max(8, Math.round(containerMaxW / aspectRatioVal));
  } else {
    stageHeight = containerMaxH;
    stageWidth = Math.max(8, Math.round(containerMaxH * aspectRatioVal));
  }

  return (
    <div className="w-full bg-card border border-border text-card-foreground rounded-3xl p-5 sm:p-6 shadow-card hover:shadow-lift relative overflow-hidden group hover:border-blue-500/40 transition-all">
      {/* Clean, Premium Header: Uncluttered, Spacious, with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-500 shrink-0 shadow-sm">
            <PenLine className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground tracking-tight">Slot 2: Signature</h3>
              {signatureSlot.customTargetMaxKB && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 font-semibold shrink-0">
                  Custom
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Official target: &lt; {Math.round(targetMaxBytes / 1024)} KB • {targetW}×{targetH} px
            </p>
          </div>
        </div>

        {/* Top Right Slot Actions (when file exists) */}
        {signatureSlot.file && (
          <div className="flex items-center gap-2">
            <StatusBadge status={signatureSlot.status} label={signatureSlot.status === 'valid' ? '100% Compliant' : undefined} />
            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
            <label className="text-xs font-semibold text-foreground hover:text-blue-500 cursor-pointer px-2.5 py-1.5 rounded-xl bg-card hover:bg-muted border border-border flex items-center gap-1.5 transition-all">
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Replace</span>
              <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => clearSlot('signature')}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive-soft transition-colors"
              title="Remove signature"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSaveSingle}
              className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Save Signature</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Studio Body: Loaded vs Empty State */}
      {signatureSlot.file ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Visual Paper Studio Canvas (~42% on desktop) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* 1:1 Output Preview & Interactive Viewfinder Stage */}
            <div
              ref={containerRef}
              className="relative rounded-2xl overflow-hidden bg-muted/40 border border-border flex items-center justify-center h-60 w-full group/preview shadow-sm"
            >
              <div
                ref={stageRef}
                tabIndex={0}
                role="region"
                aria-label="Signature alignment stage. Drag to position, scroll to zoom."
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`relative rounded-xl overflow-hidden bg-card border border-border shadow-sm touch-none select-none transition-shadow ${
                  isEditorOpen ? 'cursor-grab active:cursor-grabbing ring-2 ring-blue-500/60' : ''
                }`}
                style={{ width: `${stageWidth}px`, height: `${stageHeight}px` }}
              >
                {signatureSlot.sourceUrl && (
                  isHoldingOriginal ? (
                    <img
                      src={signatureSlot.sourceUrl}
                      alt="Raw uploaded signature"
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none select-none block"
                    />
                  ) : !isEditorOpen && signatureSlot.processedDataUrl ? (
                    <img
                      src={signatureSlot.processedDataUrl}
                      alt="Clean signature on crisp white paper"
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none select-none block"
                    />
                  ) : (
                    <img
                      src={signatureSlot.sourceUrl}
                      alt="Signature framing"
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none select-none block"
                      style={{
                        transform: `translate(${localCrop.panX}px, ${localCrop.panY}px) scale(${localCrop.zoom}) rotate(${localCrop.rotation}deg)`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.12s ease-out',
                      }}
                    />
                  )
                )}

                {/* Signature Alignment Baseline Guide Overlay (when editor is active) */}
                {isEditorOpen && stageWidth >= 60 && stageHeight >= 40 && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10 animate-in fade-in duration-150"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <line x1="50" y1="10" x2="50" y2="90" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.4" />
                    <line x1="8" y1="65" x2="92" y2="65" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
                    <text x="50" y="60" fill="#93c5fd" fontSize="4" textAnchor="middle" fontWeight="bold">
                      Signature Baseline
                    </text>
                  </svg>
                )}
              </div>

              {/* Badges on preview */}
              <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-card/90 backdrop-blur-sm border border-border text-[11px] font-mono font-semibold text-foreground pointer-events-none shadow-sm">
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
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-card/90 backdrop-blur-sm border border-border text-xs font-semibold text-foreground hover:text-blue-500 flex items-center gap-1.5 shadow-sm select-none transition-all"
                  title="Hold to see original phone camera photo"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isHoldingOriginal ? 'Raw Desk Photo' : 'Hold to Compare'}</span>
                </button>
              )}
            </div>

            {/* Beginner-Friendly Crop & Position Button */}
            <button
              type="button"
              onClick={() => setIsEditorOpen(!isEditorOpen)}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                isEditorOpen
                  ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20'
                  : 'bg-muted hover:bg-card text-foreground border-border'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{isEditorOpen ? '✓ Done Framing (Position Locked)' : '✂️ Adjust Signature Crop & Framing'}</span>
            </button>

            {/* Expanded Tactile Crop Controls */}
            {isEditorOpen && (
              <div className="w-full p-3.5 rounded-2xl bg-card border border-border space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Zoom Level:</span>
                  <span className="font-mono text-blue-500 font-bold">
                    {Math.round(localCrop.zoom * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextZoom = Math.max(0.6, Math.round((localCrop.zoom - 0.1) * 100) / 100);
                      const updated = { ...localCrop, zoom: nextZoom };
                      setLocalCrop(updated);
                      commitCropAndOptimize(updated);
                    }}
                    className="p-1.5 rounded-lg bg-muted border border-border text-foreground hover:bg-card transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="0.6"
                    max="3.5"
                    step="0.05"
                    value={localCrop.zoom}
                    onChange={(e) => {
                      const updated = { ...localCrop, zoom: Number(e.target.value) };
                      setLocalCrop(updated);
                      commitCropAndOptimize(updated);
                    }}
                    className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nextZoom = Math.min(3.5, Math.round((localCrop.zoom + 0.1) * 100) / 100);
                      const updated = { ...localCrop, zoom: nextZoom };
                      setLocalCrop(updated);
                      commitCropAndOptimize(updated);
                    }}
                    className="p-1.5 rounded-lg bg-muted border border-border text-foreground hover:bg-card transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextRot = ((localCrop.rotation || 0) + 90) % 360;
                      const updated = { ...localCrop, rotation: nextRot };
                      setLocalCrop(updated);
                      commitCropAndOptimize(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-muted border border-border text-foreground hover:bg-card text-xs flex items-center gap-1 transition-colors"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-blue-500" />
                    <span>90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const reset = { zoom: 1.0, panX: 0, panY: 0, rotation: 0 };
                      setLocalCrop(reset);
                      commitCropAndOptimize(reset);
                    }}
                    className="p-1.5 rounded-lg bg-muted border border-border text-foreground hover:bg-card transition-colors"
                    title="Reset Crop Position"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  💡 Drag directly to align signature • Scroll wheel to zoom • Arrow keys nudge (1px / Shift: 10px)
                </p>
              </div>
            )}

            {/* Smart Paper & Ink Tone Quick Presets */}
            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-2.5">
              <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-border">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-blue-500" /> Paper & Ink Cleanse
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyPresetFilters(185, 1.3)}
                    className="px-2 py-0.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-semibold transition-all"
                  >
                    White Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetFilters(210, 1.8)}
                    className="px-2 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-[10px] font-medium transition-all"
                  >
                    Bold Ink
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetFilters(120, 1.0)}
                    className="px-2 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-[10px] font-medium transition-all"
                  >
                    Original
                  </button>
                </div>
              </div>

              {/* Ink Boldness Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium">Ink Boldness:</span>
                  <span className="font-mono text-blue-500 font-bold text-[11px]">
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
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* White Background Threshold Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium text-[11px]">Paper Whiteness:</span>
                  <span className="font-mono text-muted-foreground text-[10px]">
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
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Control Deck & Compliance Metrics (~58% on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Before ➔ After Compression Strip */}
            <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">Original File:</span>
                <span
                  className={`font-mono font-bold ${
                    isRawOverLimit ? 'text-rose-500' : 'text-foreground'
                  }`}
                >
                  {formatBytes(signatureSlot.sourceBytes)}
                </span>
                {isRawOverLimit ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 shadow-sm">
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                    Exceeds {Math.round(targetMaxBytes / 1024)} KB
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                    OK
                  </span>
                )}
              </div>

              <span className="text-muted-foreground font-bold px-1 hidden sm:inline">➔</span>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">Optimized:</span>
                <span className="font-mono font-bold text-primary">
                  {formatBytes(signatureSlot.processedBytes)}
                </span>
                {signatureSlot.sourceBytes > signatureSlot.processedBytes && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-soft text-primary border border-primary/30">
                    -{Math.round((1 - signatureSlot.processedBytes / signatureSlot.sourceBytes) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* 2. Live Precision Byte Counter */}
            <ByteCounter
              currentBytes={signatureSlot.processedBytes}
              targetMaxBytes={targetMaxBytes}
              targetMinBytes={requirement.targetMinBytes}
              bracketPercentage={signatureSlot.bracketPercentage}
            />

            {/* 3. Direct Target Max Size Selector */}
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

            {/* 4. Progressive Disclosure Accordion: Advanced Dimensions & Custom Presets */}
            <div className="border border-border rounded-2xl bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>⚙️ Pixel Dimensions & Custom Overrides</span>
                  <span className="font-mono text-[11px] text-muted-foreground font-normal">
                    ({tweakWidth}×{tweakHeight} px)
                  </span>
                </span>
                {isAdvancedOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {isAdvancedOpen && (
                <div className="p-4 pt-2 border-t border-border space-y-3.5 animate-in fade-in duration-150">
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
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border text-xs">
                    <span className="text-muted-foreground">Save custom configuration:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPresetName(`${activePreset.name} (Sig ${tweakMaxKB}KB • ${tweakWidth}×${tweakHeight})`);
                        setIsSavePresetModalOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-600 flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 transition-colors"
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
          className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 border-2 border-dashed border-border rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group gap-4 text-center sm:text-left bg-card/50"
        >
          <label className="cursor-pointer flex flex-col sm:flex-row items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-muted group-hover:bg-blue-500/15 text-blue-500 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs shrink-0">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground group-hover:text-blue-500 transition-colors block">
                Drop photo of your handwritten signature
              </span>
              <span className="text-xs text-muted-foreground mt-1 block">
                Cleans desk shadows to pure white & keeps &lt; {formatBytes(targetMaxBytes)} • Official {targetW}×{targetH} px
              </span>
            </div>
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
            className="px-4 py-2.5 rounded-xl bg-card hover:bg-muted border border-border hover:border-blue-500/40 text-foreground text-xs font-semibold flex items-center gap-2 shadow-xs transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>{isLoadingSample ? 'Generating sample...' : '✨ Try Sample Signature'}</span>
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
            className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setIsSavePresetModalOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <BookmarkPlus className="w-4 h-4 text-blue-500" /> Save as Custom Preset
                </h4>
                <button
                  type="button"
                  onClick={() => setIsSavePresetModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
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
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSavePresetModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-blue-500 text-white font-bold text-xs hover:bg-blue-600"
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

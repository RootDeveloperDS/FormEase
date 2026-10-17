import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  Upload,
  Crop,
  Eye,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ArrowDownToLine,
  Trash2,
  RefreshCw,
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
import { generateSamplePhotoBlob } from '../../../utils/sampleDataGenerator';

export const PhotoSlotCard: React.FC = () => {
  const {
    photoSlot,
    setSlotFile,
    clearSlot,
    updateSlotCrop,
    updateSlotTarget,
    resetSlotCustomTarget,
    optimizeSlot,
    saveCurrentAsCustomPreset,
  } = useDossierStore();

  const activePreset = usePresetStore((s) => s.getActivePreset());
  const requirement = activePreset.slots.photo;

  // Local UI states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Local crop state for butter-smooth 120 FPS interaction with ZERO canvas resets
  const [localCrop, setLocalCrop] = useState<CropState>({
    zoom: photoSlot.crop.zoom || 1.0,
    panX: photoSlot.crop.panX || 0,
    panY: photoSlot.crop.panY || 0,
    rotation: photoSlot.crop.rotation || 0,
  });

  const [tweakMaxKB, setTweakMaxKB] = useState<number>(
    photoSlot.customTargetMaxKB || (requirement ? Math.round(requirement.targetMaxBytes / 1024) : 50)
  );
  const [tweakWidth, setTweakWidth] = useState<number>(
    photoSlot.customWidth || (requirement ? requirement.width : 350)
  );
  const [tweakHeight, setTweakHeight] = useState<number>(
    photoSlot.customHeight || (requirement ? requirement.height : 350)
  );
  const [selectedRatio, setSelectedRatio] = useState<string>(
    photoSlot.customAspectRatio || (requirement ? requirement.aspectRatio : '1:1')
  );
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const handleLoadSample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsLoadingSample(true);
    try {
      const file = await generateSamplePhotoBlob();
      await setSlotFile('photo', file);
    } catch (err) {
      console.error('Failed to load sample photo:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Sync local crop when photoSlot changes from outside (e.g. initial load or reset)
  useEffect(() => {
    setLocalCrop({
      zoom: photoSlot.crop.zoom || 1.0,
      panX: photoSlot.crop.panX || 0,
      panY: photoSlot.crop.panY || 0,
      rotation: photoSlot.crop.rotation || 0,
    });
  }, [photoSlot.file]);

  // Debounced store synchronization to eliminate 100s of parallel optimization runs
  const debouncedCommitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitCropAndOptimize = useCallback(
    (newCrop: CropState) => {
      if (debouncedCommitRef.current) {
        clearTimeout(debouncedCommitRef.current);
      }
      debouncedCommitRef.current = setTimeout(() => {
        updateSlotCrop('photo', newCrop);
        optimizeSlot('photo');
      }, 280);
    },
    [updateSlotCrop, optimizeSlot]
  );

  useEffect(() => {
    return () => {
      if (debouncedCommitRef.current) clearTimeout(debouncedCommitRef.current);
    };
  }, []);

  // Stage & Drag refs
  const stageRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  // Sync target inputs with requirement
  useEffect(() => {
    if (requirement) {
      setTweakMaxKB(
        photoSlot.customTargetMaxKB || Math.round(requirement.targetMaxBytes / 1024)
      );
      setTweakWidth(photoSlot.customWidth || requirement.width);
      setTweakHeight(photoSlot.customHeight || requirement.height);
      setSelectedRatio(photoSlot.customAspectRatio || requirement.aspectRatio);
    }
  }, [photoSlot.customTargetMaxKB, photoSlot.customWidth, photoSlot.customHeight, photoSlot.customAspectRatio, requirement]);

  // Stage container ref
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [commitCropAndOptimize, photoSlot.file, isEditorOpen]);

  if (!requirement) return null;

  const targetMaxBytes = photoSlot.customTargetMaxKB
    ? photoSlot.customTargetMaxKB * 1024
    : requirement.targetMaxBytes;
  const targetW = photoSlot.customWidth || requirement.width;
  const targetH = photoSlot.customHeight || requirement.height;
  const aspectRatioVal = (photoSlot.customWidth && photoSlot.customHeight)
    ? (targetW / targetH)
    : (photoSlot.customAspectRatioValue || (targetW / targetH) || requirement.aspectRatioValue);

  // Exact Stage Box Dimensions: scales strictly with user-configured aspect ratio
  // Fits proportionally within max studio viewport boundaries [280px width x 192px height]
  const containerMaxW = 280;
  const containerMaxH = 192;
  const maxBoxAspect = containerMaxW / containerMaxH; // ~1.458

  let stageWidth: number;
  let stageHeight: number;

  if (aspectRatioVal >= maxBoxAspect) {
    // Landscape or ultra-wide ratio (e.g. 4000x80 or 600x200)
    stageWidth = containerMaxW;
    stageHeight = Math.max(8, Math.round(containerMaxW / aspectRatioVal));
  } else {
    // Portrait, square, or ultra-tall ratio (e.g. 55x3500 or 350x450)
    stageHeight = containerMaxH;
    stageWidth = Math.max(8, Math.round(containerMaxH * aspectRatioVal));
  }

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

  // Keyboard Nudge Handlers
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

  // File Handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSlotFile('photo', e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSlotFile('photo', e.target.files[0]);
    }
  };

  const handleSaveSingle = () => {
    if (!photoSlot.processedBlob) return;
    const item = {
      id: 'photo',
      slotType: 'photo' as const,
      title: requirement.title,
      originalFileName: photoSlot.file?.name || 'photo.jpg',
      blob: photoSlot.processedBlob,
      finalBytes: photoSlot.processedBytes,
      targetMaxBytes,
      width: photoSlot.processedWidth || targetW,
      height: photoSlot.processedHeight || targetH,
      mimeType: photoSlot.mimeType,
      passed: photoSlot.status === 'valid',
    };
    const fileName = getStandardizedFileName(item, 0);
    saveAs(photoSlot.processedBlob, fileName);
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

  const isRawOverLimit = photoSlot.file ? photoSlot.sourceBytes > targetMaxBytes : false;

  return (
    <div className="w-full bg-card border border-border text-card-foreground rounded-3xl p-5 sm:p-6 shadow-card hover:shadow-lift relative overflow-hidden group hover:border-primary/40 transition-all">
      {/* Clean, Premium Header: Uncluttered, Spacious, with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground tracking-tight">Slot 1: Photograph</h3>
              {photoSlot.customTargetMaxKB && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/30 font-semibold shrink-0">
                  Custom
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Official target: &lt; {Math.round(targetMaxBytes / 1024)} KB • {targetW}×{targetH} px ({selectedRatio})
            </p>
          </div>
        </div>

        {/* Top Right Slot Actions (when file exists) */}
        {photoSlot.file && (
          <div className="flex items-center gap-2">
            <StatusBadge status={photoSlot.status} label={photoSlot.status === 'valid' ? '100% Compliant' : undefined} />
            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
            <label className="text-xs font-semibold text-foreground hover:text-primary cursor-pointer px-2.5 py-1.5 rounded-xl bg-card hover:bg-muted border border-border flex items-center gap-1.5 transition-all">
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Replace</span>
              <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => clearSlot('photo')}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive-soft transition-colors"
              title="Remove photograph"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSaveSingle}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Save Photo</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Studio Body: Loaded vs Empty State */}
      {photoSlot.file ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Visual Viewfinder Studio Stage (~42% on desktop) */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-3">
            {/* Viewfinder Frame */}
            <div
              ref={containerRef}
              className="relative rounded-2xl overflow-hidden bg-muted/40 border border-border flex items-center justify-center h-60 w-full group/preview shadow-sm"
            >
              {/* Exact Stage Box with Strict Aspect Ratio */}
              <div
                ref={stageRef}
                tabIndex={0}
                role="region"
                aria-label="Photo alignment stage. Drag to position, scroll to zoom."
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`relative rounded-xl overflow-hidden bg-card border border-border shadow-sm touch-none select-none transition-shadow ${
                  isEditorOpen ? 'cursor-grab active:cursor-grabbing ring-2 ring-primary/60' : ''
                }`}
                style={{ width: `${stageWidth}px`, height: `${stageHeight}px` }}
              >
                {photoSlot.sourceUrl && (
                  isHoldingOriginal ? (
                    <img
                      src={photoSlot.sourceUrl}
                      alt="Original photograph"
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none select-none block"
                    />
                  ) : !isEditorOpen && photoSlot.processedDataUrl ? (
                    <img
                      src={photoSlot.processedDataUrl}
                      alt="Photograph preview"
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none select-none block"
                    />
                  ) : (
                    <img
                      src={photoSlot.sourceUrl}
                      alt="Photograph preview"
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

                {/* Beginner-Friendly Face Alignment Guide Overlay (only when viewport is sufficiently sized) */}
                {isEditorOpen && stageWidth >= 60 && stageHeight >= 60 && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10 animate-in fade-in duration-150"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <line
                      x1="50"
                      y1="5"
                      x2="50"
                      y2="95"
                      stroke="#10b981"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                      opacity="0.75"
                    />
                    <ellipse
                      cx="50"
                      cy="50"
                      rx="27"
                      ry="36"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      strokeDasharray="3 2"
                      opacity="0.85"
                    />
                    <line
                      x1="30"
                      y1="18"
                      x2="70"
                      y2="18"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      opacity="0.9"
                    />
                    <text x="50" y="14" fill="#38bdf8" fontSize="3.5" textAnchor="middle" fontWeight="bold">
                      Top of Head
                    </text>
                    <line
                      x1="24"
                      y1="44"
                      x2="76"
                      y2="44"
                      stroke="#facc15"
                      strokeWidth="1.2"
                      opacity="0.9"
                    />
                    <text x="50" y="41" fill="#facc15" fontSize="3.5" textAnchor="middle" fontWeight="bold">
                      Eyes Here
                    </text>
                    <line
                      x1="35"
                      y1="82"
                      x2="65"
                      y2="82"
                      stroke="#34d399"
                      strokeWidth="1.2"
                      opacity="0.9"
                    />
                    <text x="50" y="89" fill="#34d399" fontSize="3.5" textAnchor="middle" fontWeight="bold">
                      Chin Here
                    </text>
                  </svg>
                )}
              </div>

              {/* Dimensions pill */}
              <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-card/90 backdrop-blur-sm border border-border text-[11px] font-mono font-semibold text-foreground pointer-events-none shadow-sm">
                {formatDimensions(photoSlot.processedWidth || targetW, photoSlot.processedHeight || targetH)}
              </div>

              {/* Hold to Compare Floating Button */}
              {photoSlot.sourceUrl && (
                <button
                  type="button"
                  onMouseDown={() => setIsHoldingOriginal(true)}
                  onMouseUp={() => setIsHoldingOriginal(false)}
                  onMouseLeave={() => setIsHoldingOriginal(false)}
                  onTouchStart={() => setIsHoldingOriginal(true)}
                  onTouchEnd={() => setIsHoldingOriginal(false)}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-card/90 backdrop-blur-sm border border-border text-xs font-semibold text-foreground hover:text-primary flex items-center gap-1.5 shadow-sm select-none transition-all"
                  title="Hold to see original unaligned photo"
                >
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>{isHoldingOriginal ? 'Raw Original' : 'Hold to Compare'}</span>
                </button>
              )}
            </div>

            {/* Beginner-Friendly Crop & Position Button */}
            <button
              type="button"
              onClick={() => setIsEditorOpen(!isEditorOpen)}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                isEditorOpen
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-muted hover:bg-card text-foreground border-border'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{isEditorOpen ? '✓ Done Alignment (Position Locked)' : '✂️ Adjust Face Crop & Framing'}</span>
            </button>

            {/* Expanded Tactile Editor Controls */}
            {isEditorOpen && (
              <div className="w-full p-3.5 rounded-2xl bg-card border border-border space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Zoom Level:</span>
                  <span className="font-mono text-primary font-bold">
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
                    max="3.0"
                    step="0.05"
                    value={localCrop.zoom}
                    onChange={(e) => {
                      const updated = { ...localCrop, zoom: Number(e.target.value) };
                      setLocalCrop(updated);
                      commitCropAndOptimize(updated);
                    }}
                    className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nextZoom = Math.min(3.0, Math.round((localCrop.zoom + 0.1) * 100) / 100);
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
                    <RotateCw className="w-3.5 h-3.5 text-primary" />
                    <span>90°</span>
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  💡 Drag directly on the face • Scroll wheel to zoom • Arrow keys nudge
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Control Deck & Compliance Metrics (~58% on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Before ➔ After Compression Strip: Clean, Spacious, Confident */}
            <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">Original File:</span>
                <span
                  className={`font-mono font-bold ${
                    isRawOverLimit ? 'text-rose-500' : 'text-foreground'
                  }`}
                >
                  {formatBytes(photoSlot.sourceBytes)}
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
                  {formatBytes(photoSlot.processedBytes)}
                </span>
                {photoSlot.sourceBytes > photoSlot.processedBytes && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-soft text-primary border border-primary/30">
                    -{Math.round((1 - photoSlot.processedBytes / photoSlot.sourceBytes) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* 2. Live Precision Byte Counter */}
            <ByteCounter
              currentBytes={photoSlot.processedBytes}
              targetMaxBytes={targetMaxBytes}
              targetMinBytes={requirement.targetMinBytes}
              bracketPercentage={photoSlot.bracketPercentage}
            />

            {/* 3. File Size Ceiling Controller */}
            <SizeCeilingController
              currentKB={tweakMaxKB}
              defaultKB={requirement ? Math.round(requirement.targetMaxBytes / 1024) : 50}
              minKB={5}
              maxKB={2000}
              presets={[
                { kb: 20, badge: 'Small' },
                { kb: 50, badge: 'UPSC/SSC' },
                { kb: 100, badge: 'Govt' },
                { kb: 240, badge: 'US Visa' },
              ]}
              accentColor="emerald"
              label="Photo Size Limit"
              onChange={(kb) => {
                setTweakMaxKB(kb);
                updateSlotTarget('photo', { maxKB: kb });
              }}
              onReset={() => resetSlotCustomTarget('photo')}
              showReset={!!photoSlot.customTargetMaxKB}
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
                    ({tweakWidth}×{tweakHeight} px • {selectedRatio})
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
                    slotType="photo"
                    accentColor="emerald"
                    onChange={({ width, height, aspectRatio, aspectRatioValue }) => {
                      setTweakWidth(width);
                      setTweakHeight(height);
                      setSelectedRatio(aspectRatio);
                      updateSlotTarget('photo', {
                        width,
                        height,
                        aspectRatio,
                        aspectRatioValue,
                      });
                    }}
                    onReset={() => {
                      setTweakWidth(requirement.width);
                      setTweakHeight(requirement.height);
                      setSelectedRatio(requirement.aspectRatio);
                      updateSlotTarget('photo', {
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
                        setCustomPresetName(`${activePreset.name} (${tweakMaxKB}KB • ${tweakWidth}×${tweakHeight})`);
                        setIsSavePresetModalOpen(true);
                      }}
                      className="text-primary hover:text-primary/80 flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg bg-primary-soft border border-primary/30 transition-colors"
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
          className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 border-2 border-dashed border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group gap-4 text-center sm:text-left bg-card/50"
        >
          <label className="cursor-pointer flex flex-col sm:flex-row items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-muted group-hover:bg-primary-soft text-primary flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs shrink-0">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors block">
                Drop your camera photo here or click to browse
              </span>
              <span className="text-xs text-muted-foreground mt-1 block">
                Auto-locks to &lt; {formatBytes(targetMaxBytes)} • Official {targetW}×{targetH} px ({selectedRatio})
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
            className="px-4 py-2.5 rounded-xl bg-card hover:bg-muted border border-border hover:border-primary/40 text-foreground text-xs font-semibold flex items-center gap-2 shadow-xs transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{isLoadingSample ? 'Generating sample...' : '✨ Try Sample Photo'}</span>
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
                  <BookmarkPlus className="w-4 h-4 text-primary" /> Save as Custom Preset
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
                Save your custom {tweakMaxKB} KB limit and {selectedRatio} ratio so you can instantly re-use it anytime.
              </p>
              <form onSubmit={handleSavePreset} className="space-y-3">
                <input
                  type="text"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  placeholder="e.g., My UPSC 100KB Preset"
                  required
                  autoFocus
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
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
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90"
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

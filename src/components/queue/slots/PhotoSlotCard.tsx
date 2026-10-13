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
  const aspectRatioVal = photoSlot.customAspectRatioValue || requirement.aspectRatioValue || targetW / targetH;

  // Exact Stage Box Dimensions: guarantees strict framing
  const maxStageHeight = 192; // 12rem (h-48)
  const stageHeight = maxStageHeight;
  const stageWidth = Math.min(320, Math.max(100, Math.round(stageHeight * aspectRatioVal)));

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
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all justify-between min-h-[490px]">
      <div>
        {/* Clean, Premium Header: Uncluttered, Spacious, Zero Noise */}
        <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 truncate">Slot 1: Photograph</h3>
                {photoSlot.customTargetMaxKB && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold shrink-0">
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



        {/* Slot Body: Loaded vs Empty State */}
        {photoSlot.file ? (
          <div className="space-y-3">
            {/* Consolidated Before/After & Official Validation Strip: Clean, Logical, Beautiful */}
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-slate-400 font-medium text-[11px] shrink-0">Raw:</span>
                <span
                  className={`font-mono text-xs font-bold shrink-0 ${
                    isRawOverLimit ? 'text-rose-400' : 'text-slate-300'
                  }`}
                >
                  {formatBytes(photoSlot.sourceBytes)}
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
                  {formatBytes(photoSlot.processedBytes)}
                </span>
                {photoSlot.sourceBytes > photoSlot.processedBytes && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    -{Math.round((1 - photoSlot.processedBytes / photoSlot.sourceBytes) * 100)}%
                  </span>
                )}
              </div>

              <div className="shrink-0 pl-1">
                <StatusBadge status={photoSlot.status} label={photoSlot.status === 'valid' ? ' ' : undefined} />
              </div>
            </div>

            {/* Visual Studio Stage: 100% Reliable Hardware-Accelerated Rendering (Zero Blank Frames) */}
            <div
              ref={containerRef}
              className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center h-52 group/preview shadow-md"
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
                className={`relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-md touch-none select-none transition-shadow ${
                  isEditorOpen ? 'cursor-grab active:cursor-grabbing ring-2 ring-emerald-400/60' : ''
                }`}
                style={{ width: `${stageWidth}px`, height: `${stageHeight}px` }}
              >
                {/* 100% Native Image Rendering: Butter-smooth GPU transforms, NEVER blanks or clears! */}
                {photoSlot.sourceUrl && (
                  <img
                    src={photoSlot.sourceUrl}
                    alt="Photograph preview"
                    draggable={false}
                    className="w-full h-full object-cover pointer-events-none select-none block"
                    style={{
                      transform: isHoldingOriginal
                        ? 'none'
                        : `translate(${localCrop.panX}px, ${localCrop.panY}px) scale(${localCrop.zoom}) rotate(${localCrop.rotation}deg)`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.12s ease-out',
                    }}
                  />
                )}

                {/* Beginner-Friendly Face Alignment Guide Overlay */}
                {isEditorOpen && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10 animate-in fade-in duration-150"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Center Axis */}
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
                    {/* Head Oval Outline */}
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
                    {/* Top of Head Guide */}
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
                    {/* Eyes Guide */}
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
                    {/* Chin Guide */}
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
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300 pointer-events-none">
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
                  className="absolute top-2 right-2 px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 shadow-sm select-none"
                  title="Hold to see original unaligned photo"
                >
                  <Eye className="w-3 h-3 text-blue-400" />
                  <span>{isHoldingOriginal ? 'Raw Original' : 'Hold to Diff'}</span>
                </button>
              )}
            </div>

            {/* Live Precision Byte Counter */}
            <ByteCounter
              currentBytes={photoSlot.processedBytes}
              targetMaxBytes={targetMaxBytes}
              targetMinBytes={requirement.targetMinBytes}
              bracketPercentage={photoSlot.bracketPercentage}
            />

            {/* Tactile In-Card Precision Controls */}
            <div className="space-y-3">
              {/* File Size Ceiling Controller */}
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

              {/* Pixel Dimension Controller */}
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
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-900 text-[11px]">
                <span className="text-slate-400">Save custom configuration:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomPresetName(`${activePreset.name} (${tweakMaxKB}KB • ${tweakWidth}×${tweakHeight})`);
                    setIsSavePresetModalOpen(true);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30"
                >
                  <BookmarkPlus className="w-3 h-3" /> Save to My Presets
                </button>
              </div>
            </div>

            {/* Beginner-Friendly Crop & Position Button */}
            <div className="space-y-2 pt-0.5">
              <button
                type="button"
                onClick={() => setIsEditorOpen(!isEditorOpen)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  isEditorOpen
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>{isEditorOpen ? '✓ Done Alignment (Position Locked)' : '✂️ Crop & Align Face'}</span>
              </button>

              {/* Expanded Tactile Editor Controls */}
              {isEditorOpen && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Zoom Level:</span>
                    <span className="font-mono text-emerald-400 font-bold">
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
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
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
                      className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextZoom = Math.min(3.0, Math.round((localCrop.zoom + 0.1) * 100) / 100);
                        const updated = { ...localCrop, zoom: nextZoom };
                        setLocalCrop(updated);
                        commitCropAndOptimize(updated);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
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
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1"
                      title="Rotate 90 degrees"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                      <span>Rotate 90°</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">
                    💡 Drag directly on the face • Scroll mouse wheel to zoom • Arrow keys nudge position
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty Studio Canvas Dropzone */
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl hover:border-emerald-500/40 hover:bg-emerald-950/10 transition-colors cursor-pointer text-center group"
          >
            <label className="cursor-pointer flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 transition-transform group-hover:scale-105 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">
                Drop your camera photo here or click to browse
              </span>
              <span className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                Auto-locks to &lt; {formatBytes(targetMaxBytes)} & official proportions
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
              className="mt-1 mb-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isLoadingSample ? 'Generating sample...' : '✨ Try Sample Photo'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Slot Footer */}
      {photoSlot.file && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
          <label className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Replace Photo
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
              onClick={() => clearSlot('photo')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
              title="Remove photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSaveSingle}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-500/30 shadow-sm"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" /> Save Photo
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
                  <BookmarkPlus className="w-4 h-4 text-emerald-400" /> Save as Custom Preset
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
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
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
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

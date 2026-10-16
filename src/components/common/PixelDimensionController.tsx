import React, { useState } from 'react';
import {
  Maximize2,
  Lock,
  Unlock,
  Minus,
  Plus,
  RotateCcw,
  Ruler,
  CheckCircle2,
} from 'lucide-react';

export interface DimensionPreset {
  label: string;
  subLabel?: string;
  width: number;
  height: number;
  aspectRatio: string;
}

interface PixelDimensionControllerProps {
  width: number;
  height: number;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultRatio?: string;
  presets?: DimensionPreset[];
  accentColor?: 'emerald' | 'blue' | 'amber' | 'cyan';
  slotType?: 'photo' | 'signature' | 'document' | 'general';
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  step?: number;
  onChange: (dims: {
    width: number;
    height: number;
    aspectRatio: string;
    aspectRatioValue: number;
  }) => void;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}

// Built-in smart preset defaults by domain
const DEFAULT_PHOTO_PRESETS: DimensionPreset[] = [
  { label: '350×350', subLabel: 'UPSC/SSC', width: 350, height: 350, aspectRatio: '1:1' },
  { label: '600×600', subLabel: 'US Visa 2×2"', width: 600, height: 600, aspectRatio: '1:1' },
  { label: '350×450', subLabel: '3.5×4.5 cm', width: 350, height: 450, aspectRatio: '3.5:4.5' },
  { label: '200×230', subLabel: 'State PSCs', width: 200, height: 230, aspectRatio: '200:230' },
];

const DEFAULT_SIGNATURE_PRESETS: DimensionPreset[] = [
  { label: '140×60', subLabel: 'UPSC/SSC', width: 140, height: 60, aspectRatio: '7:3' },
  { label: '200×100', subLabel: 'Banking 2:1', width: 200, height: 100, aspectRatio: '2:1' },
  { label: '300×120', subLabel: 'High-Res 5:2', width: 300, height: 120, aspectRatio: '5:2' },
  { label: '160×70', subLabel: 'State Board', width: 160, height: 70, aspectRatio: '16:7' },
];

const DEFAULT_DOCUMENT_PRESETS: DimensionPreset[] = [
  { label: '1240×1754', subLabel: 'A4 150 DPI', width: 1240, height: 1754, aspectRatio: '1:1.414' },
  { label: '1654×2339', subLabel: 'A4 200 DPI', width: 1654, height: 2339, aspectRatio: '1:1.414' },
  { label: '800×1130', subLabel: 'Web Compact', width: 800, height: 1130, aspectRatio: '1:1.414' },
];

export const PixelDimensionController: React.FC<PixelDimensionControllerProps> = ({
  width,
  height,
  defaultWidth = 350,
  defaultHeight = 350,
  defaultRatio: _defaultRatio = '1:1',
  presets,
  accentColor = 'emerald',
  slotType = 'photo',
  minWidth = 50,
  maxWidth = 4000,
  minHeight = 30,
  maxHeight = 4000,
  step = 10,
  onChange,
  onReset,
  showReset = false,
  className = '',
}) => {
  // Lock aspect ratio toggle (locked by default to prevent distorted faces/signatures)
  const [isRatioLocked, setIsRatioLocked] = useState(true);

  // Active unit tab: 'px' or 'physical'
  const [unitMode, setUnitMode] = useState<'px' | 'physical'>('px');

  // Physical units state
  const [physicalUnit, setPhysicalUnit] = useState<'cm' | 'in' | 'mm'>('cm');
  const [physicalDPI, setPhysicalDPI] = useState<number>(300);
  const [physW, setPhysW] = useState<number>(3.5);
  const [physH, setPhysH] = useState<number>(4.5);

  const activePresets =
    presets ||
    (slotType === 'signature'
      ? DEFAULT_SIGNATURE_PRESETS
      : slotType === 'document'
      ? DEFAULT_DOCUMENT_PRESETS
      : DEFAULT_PHOTO_PRESETS);

  // Theme color styles
  const colorMap = {
    emerald: {
      text: 'text-emerald-400',
      textActive: 'text-emerald-300',
      bgActive: 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20',
      badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      borderActive: 'border-emerald-400',
      lockActive: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      accent: 'accent-emerald-500',
    },
    blue: {
      text: 'text-blue-400',
      textActive: 'text-blue-300',
      bgActive: 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20',
      badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      borderActive: 'border-blue-400',
      lockActive: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      accent: 'accent-blue-500',
    },
    amber: {
      text: 'text-amber-400',
      textActive: 'text-amber-300',
      bgActive: 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20',
      badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      borderActive: 'border-amber-400',
      lockActive: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      accent: 'accent-amber-500',
    },
    cyan: {
      text: 'text-cyan-400',
      textActive: 'text-cyan-300',
      bgActive: 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20',
      badge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
      borderActive: 'border-cyan-400',
      lockActive: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      accent: 'accent-cyan-500',
    },
  };

  const theme = colorMap[accentColor] || colorMap.emerald;

  // Compute clean ratio string
  const getRatioString = (w: number, h: number): string => {
    if (w === h) return '1:1';
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const rW = w / divisor;
    const rH = h / divisor;
    if (rW <= 20 && rH <= 20) return `${rW}:${rH}`;
    return (w / h).toFixed(2) + ':1';
  };

  // Handle Width change
  const handleWidthChange = (newW: number) => {
    const clampedW = Math.max(minWidth, Math.min(maxWidth, Math.round(newW)));
    if (isRatioLocked && width > 0 && height > 0) {
      const ratio = width / height;
      const nextH = Math.max(minHeight, Math.min(maxHeight, Math.round(clampedW / ratio)));
      onChange({
        width: clampedW,
        height: nextH,
        aspectRatio: getRatioString(clampedW, nextH),
        aspectRatioValue: clampedW / nextH,
      });
    } else {
      onChange({
        width: clampedW,
        height,
        aspectRatio: getRatioString(clampedW, height),
        aspectRatioValue: clampedW / height,
      });
    }
  };

  // Handle Height change
  const handleHeightChange = (newH: number) => {
    const clampedH = Math.max(minHeight, Math.min(maxHeight, Math.round(newH)));
    if (isRatioLocked && width > 0 && height > 0) {
      const ratio = width / height;
      const nextW = Math.max(minWidth, Math.min(maxWidth, Math.round(clampedH * ratio)));
      onChange({
        width: nextW,
        height: clampedH,
        aspectRatio: getRatioString(nextW, clampedH),
        aspectRatioValue: nextW / clampedH,
      });
    } else {
      onChange({
        width,
        height: clampedH,
        aspectRatio: getRatioString(width, clampedH),
        aspectRatioValue: width / clampedH,
      });
    }
  };

  // Apply a quick preset
  const handleApplyPreset = (p: DimensionPreset) => {
    onChange({
      width: p.width,
      height: p.height,
      aspectRatio: p.aspectRatio,
      aspectRatioValue: p.width / p.height,
    });
  };

  // Physical units conversion to pixels
  const handleApplyPhysical = (wVal: number, hVal: number, unit: 'cm' | 'in' | 'mm', dpi: number) => {
    let pxW = 0;
    let pxH = 0;
    if (unit === 'in') {
      pxW = Math.round(wVal * dpi);
      pxH = Math.round(hVal * dpi);
    } else if (unit === 'cm') {
      pxW = Math.round((wVal / 2.54) * dpi);
      pxH = Math.round((hVal / 2.54) * dpi);
    } else if (unit === 'mm') {
      pxW = Math.round((wVal / 25.4) * dpi);
      pxH = Math.round((hVal / 25.4) * dpi);
    }

    const clampedW = Math.max(minWidth, Math.min(maxWidth, pxW));
    const clampedH = Math.max(minHeight, Math.min(maxHeight, pxH));

    onChange({
      width: clampedW,
      height: clampedH,
      aspectRatio: getRatioString(clampedW, clampedH),
      aspectRatioValue: clampedW / clampedH,
    });
  };

  // Visual aspect ratio silhouette box
  const ratioVal = width > 0 && height > 0 ? width / height : 1.0;
  const silhouetteMaxHeight = 24;
  const silhouetteMaxWidth = 36;
  let silW = silhouetteMaxWidth;
  let silH = Math.round(silW / ratioVal);
  if (silH > silhouetteMaxHeight) {
    silH = silhouetteMaxHeight;
    silW = Math.round(silH * ratioVal);
  }

  const isCustomized = width !== defaultWidth || height !== defaultHeight;

  return (
    <div className={`space-y-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 ${className}`}>
      {/* Header: Title, Reset, Mode Toggle */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <Maximize2 className={`w-3.5 h-3.5 ${theme.text}`} />
          <span className="text-[11px] font-bold text-slate-200 tracking-wide uppercase">
            Pixel Dimensions (px)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Unit Mode Switcher: PX vs Physical */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setUnitMode('px')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                unitMode === 'px' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pixels (px)
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('physical')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
                unitMode === 'physical'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ruler className="w-2.5 h-2.5" />
              <span>cm / in</span>
            </button>
          </div>

          {showReset && onReset && isCustomized && (
            <button
              type="button"
              onClick={onReset}
              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 underline decoration-slate-600 pl-1"
              title={`Reset to default (${defaultWidth}×${defaultHeight} px)`}
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Default</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dimension Controls by Unit Mode */}
      {unitMode === 'px' ? (
        <div className="space-y-2.5">
          {/* Tactile Dual Width & Height Steppers with Center Lock Button */}
          <div className="flex items-center justify-between gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            {/* WIDTH INPUT & STEPPERS */}
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Width
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleWidthChange(width - step)}
                  disabled={width <= minWidth}
                  className="w-6 h-6 rounded-md bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                  title={`Decrease width by ${step}px`}
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <div className="min-w-[70px] sm:min-w-[84px] flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 shadow-inner">
                  <input
                    type="number"
                    min={minWidth}
                    max={maxWidth}
                    value={width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full bg-transparent text-xs font-mono font-bold text-white text-center outline-none"
                  />
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1">px</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleWidthChange(width + step)}
                  disabled={width >= maxWidth}
                  className="w-6 h-6 rounded-md bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                  title={`Increase width by ${step}px`}
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* RATIO LOCK / UNLOCK TOGGLE with Visual Glyph */}
            <div className="flex flex-col items-center justify-center px-1 pt-3">
              <button
                type="button"
                onClick={() => setIsRatioLocked(!isRatioLocked)}
                className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                  isRatioLocked
                    ? theme.lockActive
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title={
                  isRatioLocked
                    ? 'Proportions locked: width & height scale together'
                    : 'Unlocked: adjust width and height freely'
                }
              >
                {isRatioLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              <span className="text-[8.5px] font-medium text-slate-400 mt-0.5">
                {isRatioLocked ? 'Locked' : 'Free'}
              </span>
            </div>

            {/* HEIGHT INPUT & STEPPERS */}
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Height
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleHeightChange(height - step)}
                  disabled={height <= minHeight}
                  className="w-6 h-6 rounded-md bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                  title={`Decrease height by ${step}px`}
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <div className="min-w-[70px] sm:min-w-[84px] flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 shadow-inner">
                  <input
                    type="number"
                    min={minHeight}
                    max={maxHeight}
                    value={height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full bg-transparent text-xs font-mono font-bold text-white text-center outline-none"
                  />
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1">px</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleHeightChange(height + step)}
                  disabled={height >= maxHeight}
                  className="w-6 h-6 rounded-md bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                  title={`Increase height by ${step}px`}
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Physical cm/in Conversion Deck */
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-semibold flex items-center gap-1">
              <Ruler className="w-3 h-3 text-emerald-400" />
              Notice Specifications:
            </span>
            <div className="flex items-center gap-1">
              {(['cm', 'in', 'mm'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setPhysicalUnit(u)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    physicalUnit === u
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Width ({physicalUnit})</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={physW}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPhysW(val);
                  handleApplyPhysical(val, physH, physicalUnit, physicalDPI);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs font-mono font-bold text-white text-center"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Height ({physicalUnit})</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={physH}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPhysH(val);
                  handleApplyPhysical(physW, val, physicalUnit, physicalDPI);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs font-mono font-bold text-white text-center"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Resolution</label>
              <select
                value={physicalDPI}
                onChange={(e) => {
                  const dpi = Number(e.target.value);
                  setPhysicalDPI(dpi);
                  handleApplyPhysical(physW, physH, physicalUnit, dpi);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-1 py-1 text-xs font-mono text-emerald-400 font-semibold"
              >
                <option value={200}>200 DPI</option>
                <option value={300}>300 DPI</option>
                <option value={150}>150 DPI</option>
              </select>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-mono text-center">
            Calculated: {physW}×{physH} {physicalUnit} @ {physicalDPI} DPI ={' '}
            <strong className="text-emerald-400">{width}×{height} px</strong>
          </p>
        </div>
      )}

      {/* Smart Official Dimension Chips Row */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-semibold text-slate-400 block">
          Official Dimension Standards:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {activePresets.map((p) => {
            const isMatch = width === p.width && height === p.height;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`py-1 px-1.5 rounded-xl border text-center transition-all ${
                  isMatch
                    ? `${theme.bgActive} border-transparent scale-[1.02]`
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <span className="block text-[11px] font-bold font-mono">{p.label}</span>
                {p.subLabel && (
                  <span className={`block text-[9px] truncate ${isMatch ? 'opacity-90' : 'text-slate-400'}`}>
                    {p.subLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Silhouette Visual Feedback & Compliance Pill */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
        <div className="flex items-center gap-2">
          {/* Mini Silhouette Box */}
          <div
            className="rounded border border-emerald-500/50 bg-emerald-500/20 flex items-center justify-center transition-all"
            style={{ width: `${silW}px`, height: `${silH}px` }}
            title={`Silhouette proportion: ${ratioVal.toFixed(2)}:1`}
          />
          <span className="font-mono text-xs text-slate-300 font-semibold">
            {width} × {height} px
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({getRatioString(width, height)})
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>Strict Bounds</span>
        </span>
      </div>
    </div>
  );
};

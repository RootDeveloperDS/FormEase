import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Eye, EyeOff, RotateCcw, Move } from 'lucide-react';
import type { CropState } from '../../store/useDossierStore';

interface BiometricCanvasProps {
  sourceUrl: string;
  crop: CropState;
  aspectRatioValue: number; // width / height
  aspectRatioLabel: string; // e.g. "1:1", "35:45"
  faceCoverage?: string;
  onCropChange: (crop: Partial<CropState>) => void;
  onApplyCrop: () => void;
  className?: string;
}

export const BiometricCanvas: React.FC<BiometricCanvasProps> = ({
  sourceUrl,
  crop,
  aspectRatioValue,
  aspectRatioLabel,
  faceCoverage = '70% - 80%',
  onCropChange,
  onApplyCrop,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.src = sourceUrl;
  }, [sourceUrl]);

  // Redraw canvas
  const draw = useCallback(() => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Save state
    ctx.save();
    // Center origin
    ctx.translate(width / 2 + crop.panX, height / 2 + crop.panY);
    ctx.scale(crop.zoom, crop.zoom);
    if (crop.rotation) {
      ctx.rotate((crop.rotation * Math.PI) / 180);
    }

    // Calculate source coverage
    const imgRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = width / height;
    let drawW: number;
    let drawH: number;

    if (imgRatio > canvasRatio) {
      drawH = height;
      drawW = height * imgRatio;
    } else {
      drawW = width;
      drawH = width / imgRatio;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [image, crop]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse / Touch Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - crop.panX, y: e.clientY - crop.panY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newPanX = Math.round(e.clientX - dragStart.x);
    const newPanY = Math.round(e.clientY - dragStart.y);
    onCropChange({ panX: newPanX, panY: newPanY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      onApplyCrop();
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const newZoom = Math.min(3.5, Math.max(0.6, Math.round((crop.zoom + delta) * 100) / 100));
    onCropChange({ zoom: newZoom });
  };

  // Keyboard navigation & nudging (WCAG Requirement: Arrow=1px, Shift+Arrow=10px)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    let handled = false;

    if (e.key === 'ArrowUp') {
      onCropChange({ panY: crop.panY - step });
      handled = true;
    } else if (e.key === 'ArrowDown') {
      onCropChange({ panY: crop.panY + step });
      handled = true;
    } else if (e.key === 'ArrowLeft') {
      onCropChange({ panX: crop.panX - step });
      handled = true;
    } else if (e.key === 'ArrowRight') {
      onCropChange({ panX: crop.panX + step });
      handled = true;
    } else if (e.key === '+' || e.key === '=') {
      onCropChange({ zoom: Math.min(3.5, crop.zoom + 0.1) });
      handled = true;
    } else if (e.key === '-' || e.key === '_') {
      onCropChange({ zoom: Math.max(0.6, crop.zoom - 0.1) });
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      onApplyCrop();
    }
  };

  // Dimensions of canvas display
  const baseSize = 340;
  const canvasWidth = aspectRatioValue >= 1 ? baseSize : Math.round(baseSize * aspectRatioValue);
  const canvasHeight = aspectRatioValue <= 1 ? baseSize : Math.round(baseSize / aspectRatioValue);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Interactive Canvas Stage */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label="Biometric crop stage. Use arrow keys to adjust position, shift+arrows for 10px shift."
        onKeyDown={handleKeyDown}
        className="relative rounded-2xl overflow-hidden border-2 border-border bg-muted/40 shadow-xl focus-visible:ring-2 focus-visible:ring-primary touch-none select-none cursor-grab active:cursor-grabbing"
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth * 2} // Retina 2x render
          height={canvasHeight * 2}
          style={{ width: canvasWidth, height: canvasHeight }}
        />

        {/* Biometric SVG Guideline Overlays */}
        {showGuides && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Center vertical axis */}
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              stroke="#10b981"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              opacity="0.8"
            />

            {/* Top of Head Crown Guide Arc */}
            <path
              d="M 30,22 Q 50,14 70,22"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.2"
              opacity="0.9"
            />
            <text x="50" y="12" fill="#38bdf8" fontSize="3.5" textAnchor="middle" fontWeight="bold">
              Crown Level
            </text>

            {/* Eye Level Axis */}
            <line
              x1="20"
              y1="42"
              x2="80"
              y2="42"
              stroke="#facc15"
              strokeWidth="1.2"
              opacity="0.9"
            />
            <text x="50" y="39" fill="#facc15" fontSize="3.5" textAnchor="middle" fontWeight="bold">
              Eye Level
            </text>

            {/* Chin Bottom Arc */}
            <path
              d="M 35,74 Q 50,84 65,74"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.2"
              opacity="0.9"
            />
            <text x="50" y="89" fill="#38bdf8" fontSize="3.5" textAnchor="middle" fontWeight="bold">
              Chin Line
            </text>

            {/* Face Zone Oval */}
            <ellipse
              cx="50"
              cy="48"
              rx="23"
              ry="30"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.0"
              strokeDasharray="3 3"
              opacity="0.6"
            />
          </svg>
        )}

        {/* Floating Format Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-card/90 backdrop-blur-sm border border-border text-[10px] font-mono text-foreground shadow-sm">
          {aspectRatioLabel} • {faceCoverage}
        </div>
      </div>

      {/* Tactile Control Toolbar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-card border border-border shadow-md">
        <button
          type="button"
          onClick={() => {
            onCropChange({ zoom: Math.max(0.6, Math.round((crop.zoom - 0.1) * 10) / 10) });
            onApplyCrop();
          }}
          title="Zoom out"
          aria-label="Zoom out"
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono text-foreground px-1 font-semibold">
          {Math.round(crop.zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => {
            onCropChange({ zoom: Math.min(3.5, Math.round((crop.zoom + 0.1) * 10) / 10) });
            onApplyCrop();
          }}
          title="Zoom in"
          aria-label="Zoom in"
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        <button
          type="button"
          onClick={() => {
            onCropChange({ rotation: (crop.rotation + 90) % 360 });
            onApplyCrop();
          }}
          title="Rotate 90 degrees"
          aria-label="Rotate image 90 degrees"
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowGuides(!showGuides)}
          title={showGuides ? 'Hide biometric guides' : 'Show biometric guides'}
          aria-label={showGuides ? 'Hide biometric guides' : 'Show biometric guides'}
          className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground ${
            showGuides ? 'bg-primary-soft text-primary font-bold' : 'hover:bg-muted'
          }`}
        >
          {showGuides ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            onCropChange({ zoom: 1.0, panX: 0, panY: 0, rotation: 0 });
            onApplyCrop();
          }}
          title="Reset position"
          aria-label="Reset position and zoom"
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Move className="w-3 h-3 text-muted-foreground" /> Drag to align face inside guides • Arrow keys nudge 1px
      </p>
    </div>
  );
};

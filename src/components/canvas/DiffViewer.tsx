import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Columns3, X, ZoomIn, ZoomOut, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '../../utils/byteFormatter';

interface DiffViewerProps {
  originalUrl: string;
  originalBytes: number;
  compressedUrl: string;
  compressedBytes: number;
  title: string;
  onClose: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalUrl,
  originalBytes,
  compressedUrl,
  compressedBytes,
  title,
  onClose,
}) => {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [zoom, setZoom] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateSlider(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateSlider(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  };

  // Keyboard navigation for accessible inspection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') setSliderPos((p) => Math.max(0, p - 5));
      else if (e.key === 'ArrowRight') setSliderPos((p) => Math.min(100, p + 5));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-title"
      className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-foreground animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-soft border border-primary/25 flex items-center justify-center text-primary">
              <Columns3 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="diff-title" className="text-sm font-bold text-foreground">
                A/B Quality Inspector: {title}
              </h3>
              <p className="text-xs text-muted-foreground">
                Drag the slider or use Arrow Keys to verify fine text and face sharpness
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-muted-foreground w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors ml-2"
              aria-label="Close inspector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Stage */}
        <div className="relative flex-1 min-h-[400px] overflow-hidden bg-muted/30 flex items-center justify-center p-4 select-none">
          <div
            ref={containerRef}
            className="relative max-w-full max-h-[60vh] overflow-hidden rounded-2xl border border-border shadow-2xl cursor-ew-resize touch-none bg-card"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Compressed Output (Under layer) */}
            <img
              src={compressedUrl}
              alt="Compressed output preview"
              className="max-h-[60vh] w-auto object-contain block transition-transform pointer-events-none"
              style={{ transform: `scale(${zoom})` }}
            />

            {/* Original Input (Top layer clipped by sliderPos) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={originalUrl}
                alt="Original raw upload preview"
                className="max-h-[60vh] w-auto object-contain block max-w-none transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>

            {/* Divider Line & Curtain Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-primary shadow-[0_0_12px_rgba(16,185,129,0.8)] pointer-events-none flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-7 h-7 rounded-full bg-card border-2 border-primary shadow-lg flex items-center justify-center text-primary">
                <Columns3 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Badges on left & right */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-card/90 border border-border text-xs font-mono text-muted-foreground pointer-events-none backdrop-blur-sm shadow-sm">
              Original: <span className="text-foreground font-bold">{formatBytes(originalBytes)}</span>
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-primary-soft/90 border border-primary/40 text-xs font-mono text-primary pointer-events-none backdrop-blur-sm flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Optimized: <span className="text-foreground font-bold">{formatBytes(compressedBytes)}</span>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-card/60 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Compression Factor: Saved{' '}
            <span className="text-primary font-bold">
              {Math.max(0, Math.round((1 - compressedBytes / originalBytes) * 100))}%
            </span>{' '}
            bytes while retaining maximum biometric fidelity.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-sm"
          >
            Looks Perfect
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

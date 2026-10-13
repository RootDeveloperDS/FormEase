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
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Columns3 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="diff-title" className="text-sm font-bold text-slate-100">
                A/B Quality Inspector: {title}
              </h3>
              <p className="text-xs text-slate-400">
                Drag the slider or use Arrow Keys to verify fine text and face sharpness
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-2"
              aria-label="Close inspector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Stage */}
        <div className="relative flex-1 min-h-[400px] overflow-hidden bg-slate-950 flex items-center justify-center p-4 select-none">
          <div
            ref={containerRef}
            className="relative max-w-full max-h-[60vh] overflow-hidden rounded-2xl border border-slate-800 shadow-2xl cursor-ew-resize touch-none"
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
              className="absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)] pointer-events-none flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-lg flex items-center justify-center text-emerald-400">
                <Columns3 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Badges on left & right */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-300 pointer-events-none backdrop-blur-sm">
              Original: <span className="text-white font-bold">{formatBytes(originalBytes)}</span>
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-xs font-mono text-emerald-300 pointer-events-none backdrop-blur-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Optimized: <span className="text-white font-bold">{formatBytes(compressedBytes)}</span>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Compression Factor: Saved{' '}
            <span className="text-emerald-400 font-bold">
              {Math.max(0, Math.round((1 - compressedBytes / originalBytes) * 100))}%
            </span>{' '}
            bytes while retaining maximum biometric fidelity.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
          >
            Looks Perfect
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

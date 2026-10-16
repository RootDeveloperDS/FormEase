import React from 'react';
import { formatBytes } from '../../utils/byteFormatter';
import { Zap } from 'lucide-react';

interface ByteCounterProps {
  currentBytes: number;
  targetMaxBytes: number;
  targetMinBytes?: number;
  bracketPercentage?: number;
  className?: string;
}

export const ByteCounter: React.FC<ByteCounterProps> = ({
  currentBytes,
  targetMaxBytes,
  targetMinBytes,
  bracketPercentage,
  className = '',
}) => {
  if (currentBytes === 0 || targetMaxBytes === 0) {
    return (
      <div className={`text-xs text-slate-400 font-mono ${className}`}>
        Limit: {formatBytes(targetMaxBytes)}
      </div>
    );
  }

  const ratio = currentBytes / targetMaxBytes;
  const pct = Math.min(100, Math.round(ratio * 100));
  const isOptimal = ratio >= 0.90 && ratio <= 1.0;
  const isOverLimit = ratio > 1.0;
  const isUnderMin = targetMinBytes ? currentBytes < targetMinBytes : false;

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* Precision Instrument Metric Bar Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-mono">
          <span
            className={`font-bold ${
              isOptimal
                ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                : isOverLimit
                ? 'text-rose-400 font-bold'
                : 'text-slate-200'
            }`}
          >
            {formatBytes(currentBytes)}
          </span>
          <span className="text-slate-500 font-normal">/</span>
          <span className="text-slate-400 font-medium">{formatBytes(targetMaxBytes)}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold ml-0.5">
            Max
          </span>
        </div>

        {/* Live Sweet Spot & Compliance Pill */}
        {isOptimal ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
            <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400/40 animate-pulse" />
            <span>Optimal Sharpness [PASS]</span>
          </span>
        ) : isOverLimit ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20">
            Exceeds Limit
          </span>
        ) : isUnderMin ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
            Below Min Floor
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {bracketPercentage ? `${bracketPercentage}% of Limit` : `${pct}% of Limit`}
          </span>
        )}
      </div>

      {/* Precision Instrument Glowing Progress Line */}
      <div className="relative w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden shadow-inner">
        {/* Sweet Spot Target Zone Indicator (92% - 100%) */}
        <div
          className="absolute top-0 bottom-0 right-0 w-[10%] bg-emerald-500/15 border-l border-emerald-500/30 pointer-events-none"
          title="Optimal 92%-98% Target Window"
        />

        {/* Dynamic Progress Fill with Ambient Glow */}
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out relative ${
            isOptimal
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
              : isOverLimit
              ? 'bg-gradient-to-r from-amber-500 to-orange-400'
              : 'bg-gradient-to-r from-blue-500 to-emerald-400'
          }`}
          style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
        />
      </div>
    </div>
  );
};

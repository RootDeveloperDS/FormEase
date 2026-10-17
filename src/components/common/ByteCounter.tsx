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
      <div className={`text-xs text-muted-foreground font-mono ${className}`}>
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
                ? 'text-primary drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                : isOverLimit
                ? 'text-destructive font-bold'
                : 'text-foreground'
            }`}
          >
            {formatBytes(currentBytes)}
          </span>
          <span className="text-muted-foreground font-normal">/</span>
          <span className="text-foreground font-medium">{formatBytes(targetMaxBytes)}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold ml-0.5">
            Max
          </span>
        </div>

        {/* Live Sweet Spot & Compliance Pill */}
        {isOptimal ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-soft text-primary border border-primary/40 shadow-sm shadow-primary/20">
            <Zap className="w-3 h-3 text-primary fill-primary/40 animate-pulse" />
            <span>Optimal Sharpness [PASS]</span>
          </span>
        ) : isOverLimit ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-destructive/15 text-destructive border border-destructive/40 shadow-sm shadow-destructive/20">
            Exceeds Limit
          </span>
        ) : isUnderMin ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-soft/50 text-primary border border-primary/30">
            Below Min Floor
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground border border-border">
            {bracketPercentage ? `${bracketPercentage}% of Limit` : `${pct}% of Limit`}
          </span>
        )}
      </div>

      {/* Precision Instrument Progress Line */}
      <div className="relative w-full h-2 rounded-full bg-muted border border-border overflow-hidden shadow-inner">
        {/* Sweet Spot Target Zone Indicator (92% - 100%) */}
        <div
          className="absolute top-0 bottom-0 right-0 w-[10%] bg-primary/20 border-l border-primary/40 pointer-events-none"
          title="Optimal 92%-98% Target Window"
        />

        {/* Dynamic Progress Fill */}
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out relative ${
            isOptimal
              ? 'bg-gradient-to-r from-primary to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
              : isOverLimit
              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
              : 'bg-primary'
          }`}
          style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
        />
      </div>
    </div>
  );
};

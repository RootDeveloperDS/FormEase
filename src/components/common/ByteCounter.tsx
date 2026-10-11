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

  let barColor = 'bg-blue-500';
  let badgeText = `${pct}% of Limit`;
  let badgeColor = 'text-blue-400 border-blue-500/30 bg-blue-500/10';

  if (isOptimal) {
    barColor = 'bg-emerald-400';
    badgeText = '⚡ 92%-98% Sweet Spot';
    badgeColor = 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15';
  } else if (isOverLimit) {
    barColor = 'bg-rose-500';
    badgeText = 'Exceeds Ceiling';
    badgeColor = 'text-rose-300 border-rose-500/40 bg-rose-500/15';
  } else if (isUnderMin) {
    barColor = 'bg-yellow-500';
    badgeText = 'Below Minimum';
    badgeColor = 'text-yellow-300 border-yellow-500/40 bg-yellow-500/15';
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-mono font-semibold">
          <span className={isOptimal ? 'text-emerald-400' : isOverLimit ? 'text-rose-400' : 'text-slate-200'}>
            {formatBytes(currentBytes)}
          </span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400">{formatBytes(targetMaxBytes)} Max</span>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeColor}`}
        >
          {isOptimal && <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400/30" />}
          {bracketPercentage ? `${bracketPercentage}% Target` : badgeText}
        </span>
      </div>

      {/* Progress Fuel Gauge Bar */}
      <div className="w-full h-2 rounded-full bg-slate-800/90 overflow-hidden border border-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
        />
      </div>
    </div>
  );
};

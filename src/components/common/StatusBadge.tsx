import React from 'react';
import { CheckCircle2, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'idle' | 'optimizing' | 'valid' | 'warning' | 'error';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  if (status === 'idle') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/60 shadow-sm ${className}`}
        role="status"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        {label || 'Ready'}
      </span>
    );
  }

  if (status === 'optimizing') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse shadow-sm shadow-amber-500/10 ${className}`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
        {label || ' '}
      </span>
    );
  }

  if (status === 'valid') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)] ${className}`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        {label || 'Verified Valid [PASS]'}
      </span>
    );
  }

  if (status === 'warning') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30 shadow-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        {label || 'Auto-Adjusted'}
      </span>
    );
  }

  // High-contrast eye-catching red for error state
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20 drop-shadow-[0_0_6px_rgba(244,63,94,0.3)] ${className}`}
      role="status"
      aria-live="polite"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
      {label || 'Needs Attention'}
    </span>
  );
};

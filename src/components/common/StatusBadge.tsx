import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: 'idle' | 'optimizing' | 'valid' | 'warning' | 'error';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  if (status === 'idle') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 ${className}`}
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse ${className}`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
        {label || 'Auto-Optimizing...'}
      </span>
    );
  }

  if (status === 'valid') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${className}`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        {label || 'Verified Valid [PASS]'}
      </span>
    );
  }

  if (status === 'warning') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 ${className}`}
        role="status"
        aria-live="polite"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
        {label || 'Adjust Required'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 ${className}`}
      role="status"
      aria-live="polite"
    >
      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
      {label || 'Action Needed'}
    </span>
  );
};

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
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border shadow-sm ${className}`}
        role="status"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        {label || 'Ready'}
      </span>
    );
  }

  if (status === 'optimizing') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 animate-pulse shadow-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
        {label || ' '}
      </span>
    );
  }

  if (status === 'valid') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-soft text-primary border border-primary/30 shadow-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
        {label || 'Verified Valid [PASS]'}
      </span>
    );
  }

  if (status === 'warning') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 shadow-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        {label || 'Auto-Adjusted'}
      </span>
    );
  }

  // High-contrast eye-catching red for error state
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 shadow-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
      {label || 'Needs Attention'}
    </span>
  );
};

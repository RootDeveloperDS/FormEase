import React from 'react';
import { Loader2 } from 'lucide-react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold shadow-lg',
  }[size];

  const variantClasses = {
    primary:
      'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-emerald-500/20 shadow-md hover:shadow-emerald-500/30',
    emerald:
      'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-emerald-600/20 shadow-md',
    secondary:
      'bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 hover:border-slate-600',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 shadow-md',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

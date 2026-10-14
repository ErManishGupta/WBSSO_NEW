import React from 'react';

export interface BadgeProps {
  variant?: 'saffron' | 'emerald' | 'navy' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  pulseDot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  pulseDot = false,
  children,
  className = '',
}) => {
  const base =
    'inline-flex items-center font-bold rounded-full border tracking-wide select-none transition-colors';

  const variants = {
    saffron:
      'bg-orange-50 dark:bg-orange-950/50 text-[#D34D09] dark:text-amber-300 border-orange-200 dark:border-orange-800/60',
    emerald:
      'bg-emerald-50 dark:bg-emerald-950/50 text-[#138808] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    navy:
      'bg-blue-50 dark:bg-blue-950/50 text-[#0B2545] dark:text-sky-300 border-blue-200 dark:border-blue-800/60',
    warning:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    danger:
      'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60',
    neutral:
      'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const dotColors = {
    saffron: 'bg-[#FF7A00]',
    emerald: 'bg-[#138808]',
    navy: 'bg-[#0B2545]',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    neutral: 'bg-gray-400',
  };

  return (
    <span className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {pulseDot && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[variant]}`}
          />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
};

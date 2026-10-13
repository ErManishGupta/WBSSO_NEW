import React from 'react';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'role';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  size = 'md',
}) => {
  const base =
    'inline-flex items-center font-medium rounded-full border select-none transition-colors';

  const variants = {
    success: 'bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#138A36] dark:text-emerald-400 border-[#138A36]/30 dark:border-emerald-800/40',
    warning: 'bg-[#FFFAEB] dark:bg-amber-950/40 text-[#B54708] dark:text-amber-400 border-[#B54708]/30 dark:border-amber-800/40',
    danger: 'bg-[#FFEBEE] dark:bg-red-950/40 text-[#C62828] dark:text-red-400 border-[#C62828]/30 dark:border-red-800/40',
    info: 'bg-[#EFF8FF] dark:bg-sky-950/40 text-[#1D4A9B] dark:text-sky-400 border-[#1D4A9B]/30 dark:border-sky-800/40',
    neutral: 'bg-[#F4F6FA] dark:bg-slate-800 text-[#475467] dark:text-slate-300 border-[#D9DFEA] dark:border-slate-700',
    role: 'bg-[#14306B]/10 dark:bg-orange-950/40 text-[#14306B] dark:text-orange-300 border-[#14306B]/25 dark:border-orange-800/40 font-semibold',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

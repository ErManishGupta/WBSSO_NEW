import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'dashed';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const base =
    'rounded-xl border bg-white dark:bg-[#0F1D35] p-5 transition-all text-[#101828] dark:text-slate-100 relative';

  const variants = {
    default: 'border-[#D9DFEA] dark:border-slate-800 shadow-[0_1px_3px_rgba(16,24,40,0.05)]',
    interactive:
      'border-[#D9DFEA] dark:border-slate-800 shadow-[0_1px_3px_rgba(16,24,40,0.05)] hover:shadow-[0_6px_16px_rgba(20,48,107,0.08)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:border-[#FF7A00]/50 dark:hover:border-[#FF7A00]/60 cursor-pointer',
    dashed:
      'border-2 border-dashed border-[#B9C5DB] dark:border-slate-700 bg-[#F4F6FA]/60 dark:bg-slate-900/40 hover:bg-[#F4F6FA] dark:hover:bg-slate-900 hover:border-[#FF7A00] dark:hover:border-[#FF7A00] cursor-pointer flex flex-col items-center justify-center text-center',
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

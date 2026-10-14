import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'glass' | 'elevated' | 'glow' | 'interactive' | 'flat';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  className = '',
  ...props
}) => {
  const base = 'rounded-3xl border transition-all duration-300 relative';

  const variants = {
    glass:
      'bg-white/90 dark:bg-[#0F1D35]/90 backdrop-blur-xl border-gray-200/90 dark:border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)]',
    elevated:
      'bg-white dark:bg-[#0F1D35] border-gray-200 dark:border-slate-800 shadow-md',
    glow:
      'bg-white/90 dark:bg-[#0F1D35]/90 backdrop-blur-xl border-gray-200/90 dark:border-slate-800 card-hover-glow shadow-sm',
    interactive:
      'bg-white/90 dark:bg-[#0F1D35]/90 backdrop-blur-md border-gray-200/80 dark:border-slate-800 hover:border-[#FF7A00]/50 hover:shadow-md cursor-pointer',
    flat:
      'bg-gray-50/70 dark:bg-slate-900/60 border-gray-200 dark:border-slate-800',
  };

  return (
    <motion.div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </motion.div>
  );
};

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'saffron' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      className = '',
      ...props
    },
    ref
  ) => {
    const base =
      'relative inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none overflow-hidden cursor-pointer';

    const variants = {
      primary:
        'bg-[#0B2545] hover:bg-[#133863] text-white shadow-sm focus:ring-[#0B2545] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white',
      saffron:
        'btn-saffron-glow text-white focus:ring-[#FF7A00]',
      secondary:
        'bg-gray-100 dark:bg-slate-850 hover:bg-gray-200 dark:hover:bg-slate-800 text-[#0B2545] dark:text-slate-100 border border-gray-200 dark:border-slate-700 focus:ring-gray-300',
      outline:
        'bg-transparent border border-gray-300 dark:border-slate-700 text-[#0B2545] dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60 focus:ring-[#FF7A00]',
      ghost:
        'bg-transparent text-gray-600 dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50',
      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 h-8',
      md: 'px-4 py-2.5 text-xs sm:text-sm gap-2 h-10',
      lg: 'px-5 py-3 text-sm sm:text-base gap-2.5 h-12',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        disabled={disabled || isLoading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {/* Shimmer light beam on saffron variant */}
        {variant === 'saffron' && !isLoading && (
          <div className="absolute inset-0 w-1/3 bg-white/20 skew-x-[-20deg] animate-btn-shimmer pointer-events-none" />
        )}

        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>{typeof children === 'string' ? children : 'Loading...'}</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

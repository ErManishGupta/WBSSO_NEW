import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-3 focus:ring-[#14306B]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[#0B2545] hover:bg-[#133863] text-white shadow-sm border border-transparent dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white',
      secondary:
        'bg-[#F4F6FA] hover:bg-[#E9EEF6] text-[#0B2545] border border-[#D9DFEA] dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-100 dark:border-slate-700',
      outline:
        'border border-[#0B2545] text-[#0B2545] hover:bg-[#0B2545]/5 bg-transparent dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60',
      danger:
        'bg-[#C62828] hover:bg-[#B71C1C] text-white shadow-sm border border-transparent dark:bg-red-700 dark:hover:bg-red-600',
      ghost:
        'text-[#475467] hover:text-[#101828] hover:bg-black/5 bg-transparent dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs h-8 gap-1.5',
      md: 'px-4 py-2 text-sm h-10 gap-2',
      lg: 'px-5 py-2.5 text-base h-11 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

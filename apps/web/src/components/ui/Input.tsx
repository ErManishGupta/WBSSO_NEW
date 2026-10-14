import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  isPassword?: boolean;
  capsLockWarning?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      isPassword = false,
      capsLockWarning = false,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-[#1F2937] dark:text-slate-200 uppercase tracking-wider transition-colors"
          >
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="relative group">
          {leadingIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#FF7A00] transition-colors">
              {leadingIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={computedType}
            className={`w-full py-2.5 sm:py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
              leadingIcon ? 'pl-10' : 'pl-3.5'
            } ${
              isPassword || trailingIcon ? 'pr-11' : 'pr-3.5'
            } ${
              error
                ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:ring-2 focus:ring-red-400 focus:border-red-500'
                : 'border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00]'
            } ${className}`}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              id="toggle-password-visibility"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-slate-400 hover:text-[#D34D09] dark:hover:text-amber-400 transition-colors focus:outline-none cursor-pointer"
              title={showPassword ? 'Hide password' : 'View password'}
              aria-label={showPassword ? 'Hide password' : 'View password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          ) : trailingIcon ? (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
              {trailingIcon}
            </div>
          ) : null}
        </div>

        {capsLockWarning && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 animate-in fade-in">
            <span>⚠️ Caps Lock is ON</span>
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in">
            <span>{error}</span>
          </p>
        )}

        {helperText && !error && (
          <p className="text-[11px] text-gray-500 dark:text-slate-400 font-normal">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

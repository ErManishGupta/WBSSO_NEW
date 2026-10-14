import React from 'react';
import { motion } from 'framer-motion';

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  id?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  id = 'segmented-control',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`relative flex p-1 bg-gray-100 dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 ${className}`}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative flex-1 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 z-10 ${
              isSelected
                ? 'text-[#0B2545] dark:text-white'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={`${id}-indicator`}
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-xs -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

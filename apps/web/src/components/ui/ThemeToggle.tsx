import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 19,
  };

  const labelText = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <motion.button
      id="theme-toggle-btn"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      type="button"
      onClick={toggleTheme}
      title={labelText}
      aria-label={labelText}
      className={`relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-amber-400 hover:border-[#FF7A00] dark:hover:border-[#FF7A00] transition-colors duration-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:ring-offset-1 dark:focus:ring-offset-slate-900 cursor-pointer select-none ${
        sizeClasses[size]
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -8, opacity: 0, rotate: -60, scale: 0.6 }}
          animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          exit={{ y: 8, opacity: 0, rotate: 60, scale: 0.6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center shrink-0"
        >
          {isDark ? (
            <Sun size={iconSizes[size]} className="text-amber-400" />
          ) : (
            <Moon size={iconSizes[size]} className="text-[#0B2545]" />
          )}
        </motion.div>
      </AnimatePresence>
      {showLabel && (
        <span className="ml-2 text-xs font-semibold text-gray-700 dark:text-slate-200">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </motion.button>
  );
};

import React from 'react';

/**
 * Very thin 3px tricolour-inspired strip at the very top of the layout.
 * Subtle, dignified visual identifier permitted by design specifications.
 */
export const TricolourStrip: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`w-full h-[3px] flex ${className}`}
      style={{ height: '3px' }}
    >
      <div className="w-1/3 bg-[#FF9933] h-full" />
      <div className="w-1/3 bg-[#FFFFFF] h-full border-t border-b border-gray-200 dark:border-slate-700" />
      <div className="w-1/3 bg-[#138808] h-full" />
    </div>
  );
};

import React from 'react';

export interface StateEmblemProps {
  className?: string;
  size?: number;
  src?: string;
}

export const StateEmblem: React.FC<StateEmblemProps> = ({
  className = '',
  size = 48,
  src = '/wb.png',
}) => {
  return (
    <div
      role="img"
      aria-label="Government Emblem of West Bengal"
      className={`inline-flex items-center justify-center shrink-0 select-none bg-white rounded-xl p-1 shadow-xs border border-gray-200/80 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt="Government Emblem"
        className="w-full h-full object-contain filter drop-shadow-sm"
        onError={(e) => {
          // Fallback if image path differs
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
};

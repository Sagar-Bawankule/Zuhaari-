import React from 'react';

interface CardBackProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CardBack: React.FC<CardBackProps> = ({
  className = '',
  size = 'md',
}) => {
  const dimensions = {
    sm: 'w-9 h-13 sm:w-12 sm:h-17 md:w-14 md:h-20',
    md: 'w-14 h-20 sm:w-18 sm:h-25 md:w-20 md:h-28',
    lg: 'w-20 h-28 sm:w-24 sm:h-34 md:w-28 md:h-39',
  }[size];

  return (
    <div
      className={`
        relative select-none rounded-lg sm:rounded-xl overflow-hidden shrink-0
        shadow-[0_2px_8px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.2)]
        flex items-center justify-center
        ${dimensions}
        ${className}
      `}
    >
      <img
        src="/cards/back.png"
        alt="Card Back"
        className="w-full h-full object-cover pointer-events-none select-none"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

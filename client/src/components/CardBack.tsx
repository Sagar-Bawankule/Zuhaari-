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
    sm: 'w-14 h-20 sm:w-16 sm:h-22',
    md: 'w-18 h-25 sm:w-20 sm:h-28 md:w-22 md:h-31',
    lg: 'w-24 h-34 sm:w-28 sm:h-39',
  }[size];

  return (
    <div
      className={`
        relative select-none rounded-xl overflow-hidden
        shadow-[0_4px_12px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.2)]
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

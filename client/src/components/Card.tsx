import React from 'react';
import { Card as CardType } from '@shared/constants';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  isSelected?: boolean;
  isTrump?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  card,
  isPlayable = false,
  isSelected = false,
  isTrump = false,
  onClick,
  className = '',
  size = 'md',
}) => {
  // Proportions matching 2.5 x 3.5 playing cards
  const dimensions = {
    sm: 'w-16 h-23 sm:w-18 sm:h-25',
    md: 'w-24 h-34 sm:w-26 sm:h-37 md:w-28 md:h-40',
    lg: 'w-30 h-42 sm:w-34 sm:h-48',
  }[size];

  const cardImgSrc = `/cards/${card.id}.png`;

  return (
    <button
      type="button"
      disabled={!isPlayable && !onClick}
      onClick={isPlayable || onClick ? onClick : undefined}
      aria-label={`${card.rank} of ${card.suit}${isTrump ? ' (Trump)' : ''}`}
      className={`
        relative select-none rounded-xl overflow-hidden font-card
        transition-all duration-200 transform-gpu
        flex items-center justify-center
        ${dimensions}
        bg-white
        shadow-[0_4px_12px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.2)]
        ${
          isPlayable
            ? 'cursor-pointer hover:-translate-y-6 hover:shadow-[0_16px_32px_rgba(0,0,0,0.5),0_0_15px_rgba(245,158,11,0.35)] hover:ring-2 hover:ring-amber-400 active:translate-y-0'
            : onClick
            ? 'cursor-pointer hover:-translate-y-2'
            : 'cursor-default opacity-45 grayscale-[20%]'
        }
        ${isSelected ? '-translate-y-6 ring-4 ring-gold-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]' : ''}
        ${className}
      `}
    >
      {/* Authentic Full-Bleed English Pattern Playing Card */}
      <img
        src={cardImgSrc}
        alt={`${card.rank} of ${card.suit}`}
        className="w-full h-full object-cover pointer-events-none select-none"
        loading="eager"
        decoding="async"
      />

      {/* Trump Star Badge in top-right */}
      {isTrump && (
        <div
          title="Trump card"
          className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-charcoal-950 text-[10px] font-sans font-black rounded-full flex items-center justify-center shadow-md border border-amber-200 z-20 pointer-events-none"
        >
          ★
        </div>
      )}
    </button>
  );
};

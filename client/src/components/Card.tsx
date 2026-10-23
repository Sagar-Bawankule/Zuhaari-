import React from 'react';
import { Card as CardType } from '@shared/constants';
import { CutpattiCard } from '@shared/cutpatti/constants';

interface CardProps {
  card: CardType | CutpattiCard;
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
  // Proportions matching 2.5 x 3.5 playing cards across all device viewports
  const dimensions = {
    sm: 'w-11 h-15 sm:w-14 sm:h-20 md:w-16 md:h-23',
    md: 'w-16 h-23 sm:w-20 sm:h-29 md:w-24 md:h-34 lg:w-26 lg:h-37',
    lg: 'w-22 h-31 sm:w-26 sm:h-37 md:w-30 md:h-42',
  }[size];

  const cardImgSrc = `/cards/${card.id}.png`;

  return (
    <button
      type="button"
      disabled={!isPlayable && !onClick}
      onClick={isPlayable || onClick ? onClick : undefined}
      aria-label={`${card.rank} of ${card.suit}${isTrump ? ' (Trump)' : ''}`}
      className={`
        relative select-none rounded-lg sm:rounded-xl overflow-hidden font-card
        transition-all duration-200 transform-gpu shrink-0
        flex items-center justify-center
        ${dimensions}
        bg-white
        shadow-[0_2px_8px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.2)]
        ${
          isPlayable
            ? 'cursor-pointer hover:-translate-y-4 sm:hover:-translate-y-6 hover:shadow-[0_12px_24px_rgba(0,0,0,0.5),0_0_12px_rgba(245,158,11,0.35)] hover:ring-2 hover:ring-amber-400 active:translate-y-0'
            : onClick
            ? 'cursor-pointer hover:-translate-y-1.5'
            : 'cursor-default opacity-45 grayscale-[20%]'
        }
        ${isSelected ? '-translate-y-4 sm:-translate-y-6 ring-2 sm:ring-4 ring-gold-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]' : ''}
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
          className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-charcoal-950 text-[8px] sm:text-[10px] font-sans font-black rounded-full flex items-center justify-center shadow-md border border-amber-200 z-20 pointer-events-none"
        >
          ★
        </div>
      )}
    </button>
  );
};

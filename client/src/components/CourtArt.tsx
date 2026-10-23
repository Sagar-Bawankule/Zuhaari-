import React from 'react';
import { Rank, Suit } from '@shared/constants';
import { SuitIcon } from './SuitIcon';

interface CourtArtProps {
  rank: Rank;
  suit: Suit;
}

export const CourtArt: React.FC<CourtArtProps> = ({ rank, suit }) => {
  const isRed = suit === Suit.Hearts || suit === Suit.Diamonds;
  const accentColor = isRed ? '#dc2626' : '#1e3a8a';
  const goldColor = '#d97706';

  // Ornate Ace of Spades / Aces
  if (rank === Rank.Ace) {
    if (suit === Suit.Spades) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center relative p-2 select-none">
          {/* Ornate Ace of Spades Engraving */}
          <div className="relative flex items-center justify-center">
            {/* Background filigree aura */}
            <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-gold-600/30 opacity-40 scale-125" />
            <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-dashed border-charcoal-700/40" />

            {/* Giant Detailed Spade */}
            <SuitIcon suit={Suit.Spades} size={56} className="drop-shadow-md z-10" />

            {/* Inlaid Gold Heraldic Star */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-gold-400 text-xs font-serif font-black">
              ★
            </div>
          </div>

          <span className="text-[9px] sm:text-[10px] font-card tracking-widest text-charcoal-600 uppercase mt-2 font-bold">
            ZUHAARI
          </span>
        </div>
      );
    }

    // Other Aces: Elegant Large Beveled Suit Jewel
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-gold-500/20" />
          <SuitIcon suit={suit} size={52} className="drop-shadow-sm" />
        </div>
      </div>
    );
  }

  // Double-Ended Court Cards: Jack, Queen, King
  const getCourtTitle = () => {
    switch (rank) {
      case Rank.Jack:
        return 'JACK';
      case Rank.Queen:
        return 'QUEEN';
      case Rank.King:
        return 'KING';
      default:
        return '';
    }
  };

  const getCourtSymbol = () => {
    switch (rank) {
      case Rank.Jack:
        return '⚔';
      case Rank.Queen:
        return '♛';
      case Rank.King:
        return '♚';
      default:
        return '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-1 select-none overflow-hidden rounded-md border border-gold-600/40 bg-gradient-to-b from-amber-50/60 via-ivory-50 to-amber-50/60">
      {/* Top Half of Court Figure */}
      <div className="flex-1 flex flex-col items-center justify-center relative border-b border-gold-600/40">
        {/* Crown / Headdress badge */}
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gold-600 font-bold leading-none mb-0.5">
          <span>{getCourtSymbol()}</span>
          <span className="font-card tracking-wider text-[9px] sm:text-[10px]">
            {getCourtTitle()}
          </span>
          <span>{getCourtSymbol()}</span>
        </div>

        {/* Heraldic Bust / Portrait Frame */}
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-gold-700/40 flex flex-col items-center justify-center shadow-inner relative"
          style={{ backgroundColor: `${accentColor}12` }}
        >
          {/* Royal Sceptre / Medallion */}
          <span className="text-xl sm:text-2xl drop-shadow-sm leading-none">
            {rank === Rank.King ? '👑' : rank === Rank.Queen ? '👸' : '🛡️'}
          </span>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-neutral-300">
            <SuitIcon suit={suit} size={10} />
          </div>
        </div>
      </div>

      {/* Symmetrical Inverted Bottom Half */}
      <div className="flex-1 flex flex-col items-center justify-center relative rotate-180">
        {/* Crown / Headdress badge */}
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gold-600 font-bold leading-none mb-0.5">
          <span>{getCourtSymbol()}</span>
          <span className="font-card tracking-wider text-[9px] sm:text-[10px]">
            {getCourtTitle()}
          </span>
          <span>{getCourtSymbol()}</span>
        </div>

        {/* Heraldic Bust / Portrait Frame */}
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-gold-700/40 flex flex-col items-center justify-center shadow-inner relative"
          style={{ backgroundColor: `${accentColor}12` }}
        >
          <span className="text-xl sm:text-2xl drop-shadow-sm leading-none">
            {rank === Rank.King ? '👑' : rank === Rank.Queen ? '👸' : '🛡️'}
          </span>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-neutral-300">
            <SuitIcon suit={suit} size={10} />
          </div>
        </div>
      </div>
    </div>
  );
};

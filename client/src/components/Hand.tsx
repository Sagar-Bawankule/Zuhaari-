import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { Card } from './Card';
import { Card as CardType, Suit, RANK_STRENGTH } from '@shared/constants';

type SortOption = 'suit' | 'rank';

// Standard alternating suit order (Black - Red - Black - Red)
const SUIT_ORDER: Record<Suit, number> = {
  [Suit.Spades]: 0,
  [Suit.Hearts]: 1,
  [Suit.Clubs]: 2,
  [Suit.Diamonds]: 3,
};

export const Hand: React.FC = () => {
  const { gameState, isMyTurn, playCard } = useGameStore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('suit');

  const rawCards = gameState?.myHand || [];
  const myTurn = isMyTurn();
  const leadSuit = gameState?.leadSuit || null;
  const trumpSuit = gameState?.cuttDecision?.suit || null;

  // Sort cards type-wise (by suit and rank descending)
  const sortedCards = useMemo(() => {
    return [...rawCards].sort((a, b) => {
      if (sortOption === 'suit') {
        // Trump suit can be grouped first if declared, or follow standard suit order
        const suitOrderA = trumpSuit && a.suit === trumpSuit ? -1 : SUIT_ORDER[a.suit];
        const suitOrderB = trumpSuit && b.suit === trumpSuit ? -1 : SUIT_ORDER[b.suit];

        if (suitOrderA !== suitOrderB) {
          return suitOrderA - suitOrderB;
        }
        // Within same suit, highest rank first: A > K > Q > J > 10 > 9 > 8 > 7 > 6
        return (RANK_STRENGTH[b.rank] || 0) - (RANK_STRENGTH[a.rank] || 0);
      } else {
        // By rank highest first, then by suit
        const diffRank = (RANK_STRENGTH[b.rank] || 0) - (RANK_STRENGTH[a.rank] || 0);
        if (diffRank !== 0) return diffRank;
        return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
      }
    });
  }, [rawCards, sortOption, trumpSuit]);

  // Determine legality for each card
  const hasLeadSuit =
    leadSuit !== null && sortedCards.some((c) => c.suit === leadSuit);

  const isCardPlayable = (card: CardType): boolean => {
    if (!myTurn) return false;
    if (leadSuit === null) return true; // Leading the trick
    if (hasLeadSuit) return card.suit === leadSuit; // Must follow suit
    return true; // Void in lead suit, can play any card
  };

  // Keyboard navigation for accessible card play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!myTurn || sortedCards.length === 0) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null || prev >= sortedCards.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null || prev <= 0 ? sortedCards.length - 1 : prev - 1
        );
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (selectedIndex !== null && sortedCards[selectedIndex]) {
          const card = sortedCards[selectedIndex];
          if (isCardPlayable(card)) {
            playCard(card.id);
            setSelectedIndex(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [myTurn, sortedCards, selectedIndex, leadSuit, hasLeadSuit]);

  if (sortedCards.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-2 select-none">
      {/* Hand Status & Sort Controls Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 mb-1 text-xs">
        {/* Left: Card count and turn alert */}
        <div className="flex items-center gap-2">
          <span className="text-charcoal-400 font-medium">
            Your Hand ({sortedCards.length} cards)
          </span>

          {myTurn && (
            <span className="text-gold-400 font-semibold animate-pulse flex items-center gap-1.5 bg-gold-500/10 px-3 py-0.5 rounded-full border border-gold-500/30">
              <span>👉</span>
              <span>
                {leadSuit
                  ? hasLeadSuit
                    ? `Must follow ${leadSuit.toUpperCase()}`
                    : `Void in ${leadSuit.toUpperCase()} — play any card!`
                  : 'Your lead — play any card!'}
              </span>
            </span>
          )}
        </div>

        {/* Right: Sort options */}
        <div className="flex items-center gap-1 bg-charcoal-900/80 p-0.5 rounded-lg border border-charcoal-700/60">
          <button
            type="button"
            onClick={() => setSortOption('suit')}
            title="Group by Suit (♠ ♥ ♣ ♦) and High to Low"
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              sortOption === 'suit'
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                : 'text-charcoal-400 hover:text-ivory-200'
            }`}
          >
            🔀 By Suit
          </button>
          <button
            type="button"
            onClick={() => setSortOption('rank')}
            title="Sort by Rank (A down to 6)"
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              sortOption === 'rank'
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                : 'text-charcoal-400 hover:text-ivory-200'
            }`}
          >
            🔢 By Rank
          </button>
        </div>
      </div>

      {/* Cards Fan / Ribbon Tray */}
      <div className="relative flex justify-center items-end py-4 -space-x-8 sm:-space-x-10 md:-space-x-12 overflow-x-visible">
        {sortedCards.map((card, index) => {
          const playable = isCardPlayable(card);
          const isSelected = selectedIndex === index;
          const isTrump = trumpSuit !== null && card.suit === trumpSuit;

          // Compute gentle natural fanning angle
          const mid = (sortedCards.length - 1) / 2;
          const offset = index - mid;
          const rotateDeg = offset * 1.8;
          const translateY = Math.abs(offset) * 2;

          return (
            <div
              key={card.id}
              style={{
                transform: `rotate(${rotateDeg}deg) translateY(${translateY}px)`,
                zIndex: isSelected ? 40 : index + 10,
              }}
              className="transition-transform duration-200"
            >
              <Card
                card={card}
                isPlayable={playable}
                isSelected={isSelected}
                isTrump={isTrump}
                onClick={() => {
                  if (playable) {
                    playCard(card.id);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

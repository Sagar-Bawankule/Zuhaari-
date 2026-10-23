import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Card } from './Card';
import { SuitIcon } from './SuitIcon';
import {
  Suit,
  ALL_SUITS,
  SUIT_COLORS,
  SEAT_LABELS,
  RANK_STRENGTH,
} from '@shared/constants';
import { GamePhase } from '@shared/types/index';

export const CuttModal: React.FC = () => {
  const {
    gameState,
    mySeatIndex,
    room,
    submitCuttBid,
  } = useGameStore();

  if (!gameState || gameState.phase !== GamePhase.CuttDecision) {
    return null;
  }

  const isMyBidTurn = gameState.cuttBiddingSeat === mySeatIndex;
  const biddingPlayer = room?.players.find(
    (p) => p.seatIndex === gameState.cuttBiddingSeat
  );
  const biddingPlayerName =
    biddingPlayer?.name || `Seat ${SEAT_LABELS[gameState.cuttBiddingSeat]}`;

  const isDefaultCutt = (gameState as any).isDefaultCutt || false;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-charcoal-900 border border-gold-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Phase Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <span>⚡ Stage 1 Complete</span>
          <span>•</span>
          <span>Cutt Decision</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-display font-black text-ivory-100 mb-1">
          {isMyBidTurn ? 'Declare Trump Suit (Cutt)' : `${biddingPlayerName} is Deciding`}
        </h2>

        <p className="text-sm text-charcoal-300 max-w-md mx-auto mb-6">
          {isMyBidTurn
            ? isDefaultCutt
              ? 'All players passed! You must declare a Cutt suit. Target: 5 hands.'
              : 'Choose a trump suit to declare Cutt (Target: 6 hands to win) or Pass to the next player.'
            : `Waiting for ${biddingPlayerName} to declare the Trump suit or pass...`}
        </p>

        {/* If it's my turn: Interactive Suit Selection */}
        {isMyBidTurn && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALL_SUITS.map((suit) => {
                const isRed = SUIT_COLORS[suit] === 'red';

                return (
                  <button
                    key={suit}
                    onClick={() => submitCuttBid('declare', suit)}
                    className={`
                      p-4 rounded-2xl border-2 transition-all duration-200
                      flex flex-col items-center justify-center gap-1.5
                      bg-charcoal-800/80 hover:bg-charcoal-700
                      hover:scale-105 active:scale-95 shadow-lg
                      ${
                        isRed
                          ? 'border-red-600/50 hover:border-red-500 text-red-500 hover:shadow-red-500/20'
                          : 'border-charcoal-600 hover:border-ivory-200 text-ivory-100 hover:shadow-white/10'
                      }
                    `}
                  >
                    <SuitIcon suit={suit} size={36} className="drop-shadow-md" />
                    <span className="text-xs font-display font-bold uppercase tracking-wider">
                      {suit}
                    </span>
                    <span className="text-[10px] text-charcoal-400 mt-0.5">
                      Target: 6
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Pass Option (Only if not forced default cutt) */}
            {!isDefaultCutt && (
              <div className="pt-2">
                <button
                  onClick={() => submitCuttBid('pass')}
                  className="px-6 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 hover:text-ivory-100 border border-charcoal-700 text-sm font-medium transition-all"
                >
                  Pass Turn to Next Seat ⏭
                </button>
              </div>
            )}
          </div>
        )}

        {/* Player's First 5 Cards Display for Context */}
        <div className="pt-4 border-t border-charcoal-800/80">
          <p className="text-xs text-charcoal-400 uppercase tracking-wider font-semibold mb-3">
            Your First 5 Cards
          </p>
          <div className="flex justify-center -space-x-3 sm:-space-x-4 overflow-x-auto py-2 px-4">
            {[...gameState.myHand]
              .sort((a, b) => {
                const suitOrder: Record<string, number> = { spades: 0, hearts: 1, clubs: 2, diamonds: 3 };
                const sDiff = (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
                if (sDiff !== 0) return sDiff;
                return (RANK_STRENGTH[b.rank] || 0) - (RANK_STRENGTH[a.rank] || 0);
              })
              .map((card) => (
                <div key={card.id} className="transform transition-transform hover:-translate-y-2">
                  <Card card={card} size="sm" isPlayable={false} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

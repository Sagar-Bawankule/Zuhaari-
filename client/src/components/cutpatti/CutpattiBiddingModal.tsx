import React, { useState } from 'react';
import { useCutpattiStore } from '../../store/cutpattiStore';
import { Card } from '../Card';
import {
  CutpattiSuit,
  CUTPATTI_SUIT_SYMBOLS,
  CUTPATTI_SUIT_COLORS,
} from '@shared/cutpatti/constants';

export const CutpattiBiddingModal: React.FC = () => {
  const { gameState, myPlayerId, submitBid, hasSubmittedBid } = useCutpattiStore();
  const [selectedBid, setSelectedBid] = useState<number>(2);

  if (!gameState || gameState.phase !== 'bidding') return null;

  const alreadyBid = hasSubmittedBid();
  const myHand = gameState.myHand || [];
  const maxBid = gameState.cardsPerPlayer || 13;
  const trump = gameState.trumpSuit;
  const trumpColor = CUTPATTI_SUIT_COLORS[trump];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadyBid) return;
    submitBid(selectedBid);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl glass-panel p-6 sm:p-8 border-emerald-500/40 shadow-2xl animate-scale-in flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <span>🎲 Bidding Phase &bull; Round #{gameState.roundNumber}</span>
          </div>

          <h3 className="font-display font-black text-2xl sm:text-3xl text-ivory-100">
            Declare Your Trick Bid
          </h3>

          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-xs text-charcoal-400">Trump Suit for this round:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-xs uppercase flex items-center gap-1 border ${
                trumpColor === 'red'
                  ? 'bg-red-950/60 text-red-400 border-red-800/60'
                  : 'bg-charcoal-800 text-ivory-100 border-charcoal-700'
              }`}
            >
              <span>{CUTPATTI_SUIT_SYMBOLS[trump]}</span>
              <span>{trump}</span>
            </span>
          </div>
        </div>

        {/* Player's private cards preview to strategize bid */}
        <div className="w-full mb-6">
          <div className="text-xs text-charcoal-400 font-semibold mb-2 text-center uppercase tracking-wider">
            Your Hand ({myHand.length} cards)
          </div>
          <div className="flex items-center justify-center -space-x-4 sm:-space-x-6 overflow-x-auto py-2 px-4 max-w-full">
            {myHand.map((card) => (
              <Card
                key={card.id}
                card={card}
                isTrump={card.suit === trump}
                size="sm"
                className="transform transition-transform hover:-translate-y-3"
              />
            ))}
          </div>
        </div>

        {/* Bidding Controls or Waiting State */}
        {!alreadyBid ? (
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            <div className="text-center">
              <label className="block text-xs text-charcoal-300 font-semibold mb-2 uppercase tracking-wider">
                Select expected tricks to win (1 to {maxBid})
              </label>

              {/* Number Buttons Selector */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-3">
                {Array.from({ length: maxBid }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSelectedBid(n)}
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl font-display font-black text-sm sm:text-base transition-all ${
                      selectedBid === n
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-charcoal-950 scale-105 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-300'
                        : 'bg-charcoal-800/80 hover:bg-charcoal-700 text-ivory-200 border border-charcoal-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-charcoal-400">
                Score: +{selectedBid}.0 if met (plus 0.1 for each extra trick). If missed: -{selectedBid}.0 penalty.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-charcoal-950 shadow-lg shadow-emerald-950/40 transition-all active:scale-98"
            >
              Submit Bid: {selectedBid} Trick{selectedBid > 1 ? 's' : ''} 🎯
            </button>
          </form>
        ) : (
          <div className="w-full max-w-md p-4 rounded-xl bg-charcoal-900/80 border border-emerald-500/30 text-center animate-pulse">
            <span className="text-sm font-bold text-emerald-400 block mb-1">
              ✓ Bid Submitted ({gameState.bids[myPlayerId || ''] ?? 'Recorded'})
            </span>
            <span className="text-xs text-charcoal-400">
              Waiting for other players to declare bids...
            </span>
          </div>
        )}

        {/* Players Bid Status */}
        <div className="w-full max-w-md mt-6 pt-4 border-t border-charcoal-800">
          <span className="text-[11px] text-charcoal-400 uppercase tracking-wider font-semibold block mb-2 text-center">
            Player Bidding Status
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {gameState.players.map((p) => {
              const hasBid = gameState.bids[p.id] !== undefined;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-charcoal-900/60 border border-charcoal-800 text-xs"
                >
                  <span className="truncate max-w-[80px] font-medium text-ivory-200">
                    {p.name}
                  </span>
                  <span
                    className={`font-semibold text-[11px] ${
                      hasBid ? 'text-emerald-400' : 'text-charcoal-500'
                    }`}
                  >
                    {hasBid ? '✓ Ready' : 'Thinking'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useGameStore } from '../store/gameStore';

export const RulesModal: React.FC = () => {
  const { showRulesModal, setShowRulesModal } = useGameStore();

  if (!showRulesModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-charcoal-900 border border-gold-600/30 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-charcoal-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎴</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-ivory-100">
                How to Play Zuhaari
              </h2>
              <p className="text-xs text-gold-400">Rules & Strategy Guide</p>
            </div>
          </div>
          <button
            onClick={() => setShowRulesModal(false)}
            className="w-8 h-8 rounded-full bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-400 hover:text-ivory-100 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-charcoal-200">
          {/* Overview */}
          <section className="bg-charcoal-800/40 p-4 rounded-xl border border-charcoal-700/40">
            <h3 className="font-display font-semibold text-gold-300 text-base mb-2 flex items-center gap-2">
              <span>👥</span> Teams & Players
            </h3>
            <p className="leading-relaxed">
              Zuhaari is played with <strong>4 players</strong> split into two fixed teams:
            </p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-lg">
                <span className="font-bold text-blue-400">Team AC</span>
                <p className="text-xs text-charcoal-300 mt-1">Player A (Seat 0) + Player C (Seat 2)</p>
              </div>
              <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-lg">
                <span className="font-bold text-amber-400">Team BD</span>
                <p className="text-xs text-charcoal-300 mt-1">Player B (Seat 1) + Player D (Seat 3)</p>
              </div>
            </div>
          </section>

          {/* Deck */}
          <section className="bg-charcoal-800/40 p-4 rounded-xl border border-charcoal-700/40">
            <h3 className="font-display font-semibold text-gold-300 text-base mb-2 flex items-center gap-2">
              <span>🃏</span> The 36-Card Deck
            </h3>
            <p className="leading-relaxed">
              Standard playing cards from <strong>6 through Ace</strong> (9 ranks × 4 suits = 36 cards total).
            </p>
            <div className="mt-2 p-2 bg-charcoal-900/60 rounded-lg text-center font-mono text-xs sm:text-sm text-ivory-100">
              A &gt; K &gt; Q &gt; J &gt; 10 &gt; 9 &gt; 8 &gt; 7 &gt; 6
            </div>
            <p className="text-xs text-charcoal-400 mt-2">
              Ace is the highest card. 6 is the lowest card. Cards 2, 3, 4, 5 are excluded.
            </p>
          </section>

          {/* Dealing & Cutt */}
          <section className="bg-charcoal-800/40 p-4 rounded-xl border border-charcoal-700/40">
            <h3 className="font-display font-semibold text-gold-300 text-base mb-2 flex items-center gap-2">
              <span>⚡</span> Staged Dealing & Cutt Declaration
            </h3>
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                <strong>Stage 1:</strong> Each player is dealt <strong>5 cards</strong>.
              </li>
              <li>
                <strong>Cutt Phase:</strong> Player B has the first opportunity to declare the Trump suit (Cutt).
                Player B can declare a suit (Target: <strong>6 hands</strong>) or Pass.
                If passed, bidding moves clockwise. If all 4 players pass, default Cutt is triggered with target <strong>5 hands</strong>.
              </li>
              <li>
                <strong>Stage 2:</strong> Once Cutt is set, the remaining <strong>4 cards</strong> are dealt to every player (9 cards total).
              </li>
            </ol>
          </section>

          {/* Playing Tricks */}
          <section className="bg-charcoal-800/40 p-4 rounded-xl border border-charcoal-700/40">
            <h3 className="font-display font-semibold text-gold-300 text-base mb-2 flex items-center gap-2">
              <span>🎯</span> Trick-Playing Rules
            </h3>
            <ul className="list-disc list-inside space-y-2 leading-relaxed">
              <li>Player A leads the very first hand.</li>
              <li>
                <strong>Follow Suit:</strong> If you hold any card matching the lead suit, you <strong>must</strong> play it.
              </li>
              <li>
                <strong>Void in Lead Suit:</strong> If you have no cards of the lead suit, you may play <strong>any card</strong> (including a Trump card to cut).
              </li>
              <li>
                <strong>Trick Winner:</strong>
                <ul className="list-circle list-inside ml-4 mt-1 text-xs space-y-1 text-charcoal-300">
                  <li>If Trump cards are played, the highest Trump wins.</li>
                  <li>If no Trump is played, the highest card of the lead suit wins.</li>
                </ul>
              </li>
              <li>The winner of the trick leads the next hand!</li>
            </ul>
          </section>

          {/* Scoring */}
          <section className="bg-charcoal-800/40 p-4 rounded-xl border border-charcoal-700/40">
            <h3 className="font-display font-semibold text-gold-300 text-base mb-2 flex items-center gap-2">
              <span>🏆</span> Scoring & Victory
            </h3>
            <p className="leading-relaxed">
              There are <strong>9 hands</strong> in a round.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div className="p-3 bg-charcoal-900/60 rounded-lg border border-charcoal-700">
                <span className="font-bold text-ivory-100">Declared Cutt:</span>
                <p className="text-charcoal-300 mt-1">Declaring team must win at least <strong>6 hands</strong>.</p>
              </div>
              <div className="p-3 bg-charcoal-900/60 rounded-lg border border-charcoal-700">
                <span className="font-bold text-ivory-100">Default Cutt:</span>
                <p className="text-charcoal-300 mt-1">Declaring team must win at least <strong>5 hands</strong>.</p>
              </div>
            </div>
            <p className="text-xs text-charcoal-400 mt-2">
              If the declaring team reaches or exceeds their target, they win the round. Otherwise, the opposing team wins!
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-charcoal-800 flex justify-end">
          <button
            onClick={() => setShowRulesModal(false)}
            className="btn-primary"
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};

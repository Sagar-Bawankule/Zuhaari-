import React from 'react';
import { useCutpattiStore } from '../../store/cutpattiStore';

export const CutpattiRulesModal: React.FC = () => {
  const { showRulesModal, setShowRulesModal } = useCutpattiStore();

  if (!showRulesModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] glass-panel p-6 sm:p-8 border-emerald-500/40 shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <h3 className="font-display font-black text-xl sm:text-2xl text-ivory-100">
              Cutpatti Rules & Gameplay
            </h3>
          </div>
          <button
            onClick={() => setShowRulesModal(false)}
            className="w-8 h-8 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-400 hover:text-white flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Rules Content */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 text-xs sm:text-sm text-charcoal-200 leading-relaxed pr-2">
          {/* Overview */}
          <div className="p-4 rounded-xl bg-charcoal-900/60 border border-charcoal-800">
            <h4 className="font-display font-bold text-emerald-400 mb-1">
              1. Overview & Players
            </h4>
            <p>
              Cutpatti is a strategic, variable-player trick-taking card game inspired by Call Break. It supports <strong>3 to 6 players</strong> playing individually with no fixed teams. No bots are needed — the game adapts directly to the actual players in the room!
            </p>
          </div>

          {/* Deck & Dynamic Distribution */}
          <div className="p-4 rounded-xl bg-charcoal-900/60 border border-charcoal-800">
            <h4 className="font-display font-bold text-emerald-400 mb-1">
              2. 52-Card Deck & Dynamic Hand Distribution
            </h4>
            <p className="mb-2">
              Cutpatti uses a standard 52-card deck with rank hierarchy: <strong>A &gt; K &gt; Q &gt; J &gt; 10 &gt; 9 &gt; 8 &gt; 7 &gt; 6 &gt; 5 &gt; 4 &gt; 3 &gt; 2</strong>.
            </p>
            <p className="mb-2">
              Cards are distributed equally based on player count, with lowest-ranking 2s removed when needed:
            </p>
            <ul className="list-disc list-inside space-y-1 text-charcoal-300 font-mono text-xs">
              <li><strong>3 Players:</strong> 16 cards each (48 cards used, four 2s removed)</li>
              <li><strong>4 Players:</strong> 13 cards each (all 52 cards used)</li>
              <li><strong>5 Players:</strong> 10 cards each (50 cards used, two 2s removed: 2♥ &amp; 2♠)</li>
              <li><strong>6 Players:</strong> 8 cards each (48 cards used, four 2s removed)</li>
            </ul>
          </div>

          {/* Trump Suit */}
          <div className="p-4 rounded-xl bg-charcoal-900/60 border border-charcoal-800">
            <h4 className="font-display font-bold text-emerald-400 mb-1">
              3. Randomized Server Trump
            </h4>
            <p>
              At the beginning of each round, the server randomly picks one trump suit from ♠ Spades, ♥ Hearts, ♦ Diamonds, or ♣ Clubs. The trump suit is revealed to all players and remains active for the entire round.
            </p>
          </div>

          {/* Bidding */}
          <div className="p-4 rounded-xl bg-charcoal-900/60 border border-charcoal-800">
            <h4 className="font-display font-bold text-emerald-400 mb-1">
              4. Trick Bidding
            </h4>
            <p>
              Before cards are played, each player privately inspects their hand and declares how many tricks they aim to win (minimum bid is 1). All bids are revealed once everyone has submitted.
            </p>
          </div>

          {/* Playing Cards */}
          <div className="p-4 rounded-xl bg-charcoal-900/60 border border-charcoal-800">
            <h4 className="font-display font-bold text-emerald-400 mb-1">
              5. Playing Cards &amp; Trick Resolution
            </h4>
            <ul className="list-disc list-inside space-y-1 text-charcoal-300">
              <li>The first player leads any card to establish the lead suit.</li>
              <li>Players must follow suit if they hold a card of the lead suit.</li>
              <li>If a player has no cards of the lead suit (void), they may play any card (including trump or off-suit).</li>
              <li>A trump card beats any non-trump card. If multiple trumps are played, highest trump wins.</li>
              <li>If no trump is played, the highest card of the lead suit wins.</li>
              <li>The winner of each trick leads the next trick.</li>
            </ul>
          </div>

          {/* Call Break Scoring */}
          <div className="p-4 rounded-xl bg-charcoal-900/60 border border-charcoal-800">
            <h4 className="font-display font-bold text-emerald-400 mb-1">
              6. Call Break Scoring
            </h4>
            <ul className="list-disc list-inside space-y-1 text-charcoal-300">
              <li><strong>Bid Met:</strong> If you win at least your bid, you get points equal to your bid, plus <strong>+0.1</strong> for every extra trick won (e.g., Bid 3, Win 4 = +3.1 points).</li>
              <li><strong>Bid Missed:</strong> If you fail to meet your bid, you lose points equal to your bid (e.g., Bid 4, Win 2 = -4.0 points).</li>
              <li>Scores accumulate across rounds on the live leaderboard!</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-charcoal-800 text-right">
          <button
            onClick={() => setShowRulesModal(false)}
            className="px-5 py-2.5 rounded-xl font-display font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-charcoal-950 transition-colors"
          >
            Got it! 👍
          </button>
        </div>
      </div>
    </div>
  );
};

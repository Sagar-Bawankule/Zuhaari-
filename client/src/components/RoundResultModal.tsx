import React from 'react';
import { useGameStore } from '../store/gameStore';
import { TeamId, TEAM_NAMES, SUIT_SYMBOLS } from '@shared/constants';

export const RoundResultModal: React.FC = () => {
  const { roundResult, mySeatIndex, playAgain, leaveRoom } = useGameStore();

  if (!roundResult) return null;

  const myTeam =
    mySeatIndex === 0 || mySeatIndex === 2 ? TeamId.TeamAC : TeamId.TeamBD;
  const isWinner = roundResult.winningTeam === myTeam;

  const suitSymbol = SUIT_SYMBOLS[roundResult.cuttDecision.suit];
  const acHands = roundResult.teamHandsWon[TeamId.TeamAC] || 0;
  const bdHands = roundResult.teamHandsWon[TeamId.TeamBD] || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-charcoal-900 border border-gold-500/50 rounded-3xl shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Victory Glow */}
        <div
          className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isWinner ? 'bg-gold-500/20' : 'bg-red-500/15'
          }`}
        />

        {/* Trophy / Result Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-4xl shadow-glow-gold/40 mb-4 animate-bounce">
          {isWinner ? '🏆' : '🎖️'}
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl font-display font-black text-ivory-100 tracking-tight mb-1">
          {TEAM_NAMES[roundResult.winningTeam]} Wins!
        </h2>

        <p
          className={`text-sm font-semibold mb-6 ${
            isWinner ? 'text-gold-400' : 'text-charcoal-400'
          }`}
        >
          {isWinner ? '🎉 Congratulations, your team took the victory!' : 'Better luck in the next round!'}
        </p>

        {/* Score Card Card */}
        <div className="glass-panel p-5 border-charcoal-700/80 mb-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-charcoal-400 border-b border-charcoal-800 pb-2">
            <span>Round Summary (9 Hands Total)</span>
            <span>
              Trump: {suitSymbol} {roundResult.cuttDecision.suit}
            </span>
          </div>

          {/* Hands Won Scoreboard */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-2xl border ${
                roundResult.winningTeam === TeamId.TeamAC
                  ? 'bg-blue-950/60 border-blue-500/60 text-blue-300'
                  : 'bg-charcoal-800/40 border-charcoal-700 text-charcoal-400'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider block mb-1">
                Team AC (A + C)
              </span>
              <span className="text-4xl font-display font-black text-ivory-100">
                {acHands}
              </span>
              <span className="text-xs block mt-1 text-charcoal-400">
                {roundResult.cuttDecision.declaringTeam === TeamId.TeamAC
                  ? `(Target: ${roundResult.cuttDecision.target})`
                  : 'Hands Won'}
              </span>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                roundResult.winningTeam === TeamId.TeamBD
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                  : 'bg-charcoal-800/40 border-charcoal-700 text-charcoal-400'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider block mb-1">
                Team BD (B + D)
              </span>
              <span className="text-4xl font-display font-black text-ivory-100">
                {bdHands}
              </span>
              <span className="text-xs block mt-1 text-charcoal-400">
                {roundResult.cuttDecision.declaringTeam === TeamId.TeamBD
                  ? `(Target: ${roundResult.cuttDecision.target})`
                  : 'Hands Won'}
              </span>
            </div>
          </div>

          {/* Cutt Target Met Notice */}
          <div className="p-3 bg-charcoal-900/60 rounded-xl text-xs text-charcoal-300 border border-charcoal-800">
            {roundResult.cuttTargetMet ? (
              <span className="text-emerald-400 font-semibold">
                ✓ Declaring team reached their target of {roundResult.cuttDecision.target} hands!
              </span>
            ) : (
              <span className="text-red-400 font-semibold">
                ✗ Declaring team failed to reach their target of {roundResult.cuttDecision.target} hands.
              </span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={playAgain}
            className="flex-1 btn-primary text-sm py-3"
          >
            Play Another Round 🎴
          </button>
          <button
            onClick={leaveRoom}
            className="flex-1 btn-secondary text-sm py-3"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

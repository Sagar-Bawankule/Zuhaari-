import React from 'react';
import { useCutpattiStore } from '../../store/cutpattiStore';
import { CUTPATTI_SUIT_SYMBOLS } from '@shared/cutpatti/constants';

export const CutpattiRoundResultModal: React.FC = () => {
  const { roundResult, nextRound, leaveRoom, isHost } = useCutpattiStore();

  if (!roundResult) return null;

  const results = roundResult.playerResults || [];
  const leaderboard = roundResult.leaderboard || [];
  const amHost = isHost();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl glass-panel p-6 sm:p-8 border-emerald-500/40 shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <span>🏆 Round #{roundResult.roundNumber} Complete</span>
          </div>

          <h3 className="font-display font-black text-2xl sm:text-3xl text-ivory-100">
            Round Results & Leaderboard
          </h3>

          <p className="text-xs text-charcoal-400 mt-1">
            Trump was{' '}
            <span className="font-bold text-ivory-200 uppercase">
              {roundResult.trumpSuit} {CUTPATTI_SUIT_SYMBOLS[roundResult.trumpSuit]}
            </span>
          </p>
        </div>

        {/* Round Performance Breakdown Table */}
        <div className="mb-6 overflow-hidden rounded-xl border border-charcoal-700/80 bg-charcoal-900/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-800/80 text-charcoal-300 uppercase font-semibold text-[11px] border-b border-charcoal-700">
              <tr>
                <th className="p-3">Player</th>
                <th className="p-3 text-center">Bid</th>
                <th className="p-3 text-center">Won</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Round Score</th>
                <th className="p-3 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {results.map((res) => {
                const met = res.tricksWon >= res.bid;
                return (
                  <tr key={res.playerId} className="hover:bg-charcoal-800/40 transition-colors">
                    <td className="p-3 font-semibold text-ivory-100 flex items-center gap-1.5">
                      <span>{res.name}</span>
                    </td>
                    <td className="p-3 text-center font-mono text-charcoal-300">
                      {res.bid}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-ivory-100">
                      {res.tricksWon}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          met
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                            : 'bg-red-950/80 text-red-300 border border-red-700/60'
                        }`}
                      >
                        {met ? '✓ Success' : '✕ Missed'}
                      </span>
                    </td>
                    <td
                      className={`p-3 text-right font-mono font-black ${
                        res.roundScore >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {res.roundScore >= 0 ? `+${res.roundScore.toFixed(1)}` : res.roundScore.toFixed(1)}
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-ivory-100">
                      {res.totalScore >= 0 ? `+${res.totalScore.toFixed(1)}` : res.totalScore.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cumulative Leaderboard Podium */}
        <div className="mb-6 p-4 rounded-xl bg-charcoal-900/50 border border-charcoal-800">
          <span className="text-[11px] font-semibold uppercase text-charcoal-400 tracking-wider block mb-3 text-center">
            Current Standings
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {leaderboard.map((entry) => (
              <div
                key={entry.playerId}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  entry.rank === 1
                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                    : 'bg-charcoal-800/50 border-charcoal-700 text-ivory-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-sm text-gold-400">
                    #{entry.rank}
                  </span>
                  <span className="font-semibold text-xs truncate max-w-[100px]">
                    {entry.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-xs">
                  {entry.totalScore.toFixed(1)} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-charcoal-800">
          <button
            onClick={nextRound}
            className="flex-1 py-3 px-4 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-charcoal-950 shadow-lg shadow-emerald-950/40 transition-all active:scale-98"
          >
            Next Round 🎴
          </button>
          <button
            onClick={leaveRoom}
            className="py-3 px-4 rounded-xl font-display font-semibold text-xs text-charcoal-300 hover:text-white bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 transition-colors"
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
};

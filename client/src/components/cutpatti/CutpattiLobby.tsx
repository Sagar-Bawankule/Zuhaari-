import React, { useState } from 'react';
import { useCutpattiStore } from '../../store/cutpattiStore';
import {
  CUTPATTI_MIN_PLAYERS,
  CUTPATTI_MAX_PLAYERS,
} from '@shared/cutpatti/constants';

export const CutpattiLobby: React.FC = () => {
  const {
    room,
    roomCode,
    myPlayerId,
    isHost,
    toggleReady,
    startGame,
    leaveRoom,
    error,
  } = useCutpattiStore();

  const [copied, setCopied] = useState(false);

  if (!room) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 animate-fade-in flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl mb-4 animate-pulse">
          🃏
        </div>
        <h2 className="font-display font-black text-2xl text-ivory-100 mb-2">
          Connecting to Cutpatti Room...
        </h2>
        {roomCode && (
          <p className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full mb-4">
            Room Code: {roomCode}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-charcoal-400 mb-6">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Syncing lobby details with server</span>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs max-w-xs">
            {error}
          </div>
        )}
        <button
          onClick={leaveRoom}
          type="button"
          className="py-2.5 px-5 rounded-xl font-display font-semibold text-xs text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 transition-colors"
        >
          Cancel & Leave
        </button>
      </div>
    );
  }

  const players = room.players || [];
  const playerCount = players.length;
  const myPlayer = players.find((p) => p.id === myPlayerId);
  const amHost = isHost();

  const handleCopy = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const canStart =
    amHost &&
    playerCount >= CUTPATTI_MIN_PLAYERS &&
    playerCount <= CUTPATTI_MAX_PLAYERS &&
    players.every((p) => p.isReady);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 animate-fade-in flex flex-col items-center">
      {/* Lobby Header */}
      <div className="w-full max-w-2xl text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>🃏 Cutpatti Lobby</span>
        </div>
        <h2 className="font-display font-black text-2xl sm:text-4xl text-ivory-100 tracking-wider">
          Game Room
        </h2>

        {/* Room Code Card */}
        <div className="mt-4 inline-flex items-center gap-3 bg-charcoal-900/90 border border-emerald-500/40 rounded-2xl px-5 py-2.5 shadow-xl backdrop-blur-md">
          <div className="text-left">
            <span className="text-[10px] text-charcoal-400 font-semibold uppercase tracking-wider block">
              Room Code
            </span>
            <span className="font-mono font-black text-xl sm:text-2xl text-emerald-400 tracking-widest">
              {roomCode}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all active:scale-95"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* Players Card */}
      <div className="w-full max-w-2xl glass-panel p-6 sm:p-8 border-emerald-500/30 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-800 mb-6">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-ivory-100 flex items-center gap-2">
              <span>Players Joined</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {playerCount} / {CUTPATTI_MAX_PLAYERS}
              </span>
            </h3>
            <span className="text-xs text-charcoal-400">
              Min {CUTPATTI_MIN_PLAYERS} players required to start
            </span>
          </div>

          <div className="text-right">
            <span
              className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                playerCount >= CUTPATTI_MIN_PLAYERS
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                  : 'bg-amber-950/60 text-amber-300 border-amber-700/50'
              }`}
            >
              {playerCount >= CUTPATTI_MIN_PLAYERS
                ? 'Ready for start'
                : `Need ${CUTPATTI_MIN_PLAYERS - playerCount} more`}
            </span>
          </div>
        </div>

        {/* Players List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {Array.from({ length: CUTPATTI_MAX_PLAYERS }).map((_, idx) => {
            const player = players[idx];
            if (player) {
              const isMe = player.id === myPlayerId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : 'bg-charcoal-900/60 border-charcoal-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-charcoal-800 border border-charcoal-700 flex items-center justify-center font-display font-bold text-sm text-ivory-100">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-sm text-ivory-100">
                          {player.name}
                        </span>
                        {player.isHost && (
                          <span
                            title="Room Host"
                            className="text-xs text-amber-400"
                          >
                            👑
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-charcoal-700 text-charcoal-300">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-charcoal-400">
                        Seat #{player.seatIndex + 1}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                        player.isReady
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                          : 'bg-charcoal-800 text-charcoal-400 border-charcoal-700'
                      }`}
                    >
                      {player.isReady ? '✓ Ready' : 'Waiting'}
                    </span>
                  </div>
                </div>
              );
            }

            // Empty seat slot
            return (
              <div
                key={`empty-${idx}`}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-charcoal-800 bg-charcoal-950/30 opacity-60"
              >
                <div className="w-9 h-9 rounded-xl border border-dashed border-charcoal-800 flex items-center justify-center text-xs text-charcoal-600 font-mono">
                  {idx + 1}
                </div>
                <div>
                  <span className="text-xs text-charcoal-500 italic block">
                    {idx < CUTPATTI_MIN_PLAYERS
                      ? 'Open Seat (Required)'
                      : 'Open Seat (Optional)'}
                  </span>
                  <span className="text-[10px] text-charcoal-600">
                    Waiting for player...
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-charcoal-800">
          {/* Ready Button */}
          <button
            onClick={toggleReady}
            type="button"
            className={`w-full sm:w-auto sm:flex-1 py-3 px-4 rounded-xl font-display font-bold text-sm transition-all border ${
              myPlayer?.isReady
                ? 'bg-charcoal-800 hover:bg-charcoal-700 text-ivory-200 border-charcoal-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-charcoal-950 border-emerald-400 shadow-lg shadow-emerald-950/40'
            }`}
          >
            {myPlayer?.isReady ? 'Cancel Ready ✕' : 'I am Ready! ✓'}
          </button>

          {/* Start Button (Host only) */}
          {amHost ? (
            <button
              onClick={startGame}
              disabled={!canStart}
              type="button"
              className={`w-full sm:w-auto sm:flex-1 py-3 px-4 rounded-xl font-display font-bold text-sm transition-all shadow-lg ${
                canStart
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-charcoal-950 cursor-pointer shadow-emerald-950/50'
                  : 'bg-charcoal-800 text-charcoal-500 border border-charcoal-700 cursor-not-allowed opacity-60'
              }`}
            >
              Start Game 🚀
            </button>
          ) : (
            <div className="w-full sm:w-auto sm:flex-1 py-3 px-4 rounded-xl bg-charcoal-900/60 border border-charcoal-800 text-center text-xs text-charcoal-400 font-medium">
              Waiting for host to start...
            </div>
          )}

          {/* Leave Button */}
          <button
            onClick={leaveRoom}
            type="button"
            className="w-full sm:w-auto py-3 px-4 rounded-xl font-display font-semibold text-xs text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

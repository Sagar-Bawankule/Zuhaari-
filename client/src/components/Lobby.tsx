import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SeatIndex, SEAT_LABELS, SEAT_TEAM, TeamId, TEAM_NAMES } from '@shared/constants';

export const Lobby: React.FC = () => {
  const {
    room,
    roomCode,
    mySeatIndex,
    selectSeat,
    toggleReady,
    startGame,
    isHost,
  } = useGameStore();

  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const myPlayer = room.players.find((p) => p.seatIndex === mySeatIndex);
  const isReady = myPlayer?.isReady || false;

  // Check if all 4 seats are occupied and all players are ready
  const isFull = room.players.length === 4;
  const allReady = isFull && room.players.every((p) => p.isReady);

  // Group seats by index: 0 (A), 1 (B), 2 (C), 3 (D)
  const seats: SeatIndex[] = [0, 1, 2, 3];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top Banner / Room Code Callout */}
      <div className="glass-panel p-6 mb-8 text-center border-gold-600/30">
        <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold">
          Private Room Lobby
        </span>
        <div className="flex items-center justify-center gap-3 my-2">
          <span className="text-3xl sm:text-4xl font-mono font-black text-ivory-100 tracking-wider">
            {roomCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/40 text-xs font-semibold transition-all"
          >
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>
        </div>
        <p className="text-xs text-charcoal-400">
          Share this 6-character room code with 3 friends to join the game table
        </p>
      </div>

      {/* Seats Layout: Team AC on left, Team BD on right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Team AC Column */}
        <div className="glass-panel p-5 border-blue-900/40 bg-gradient-to-b from-blue-950/20 to-charcoal-900/60">
          <div className="flex items-center justify-between border-b border-blue-900/40 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <h3 className="font-display font-bold text-lg text-blue-400">
                {TEAM_NAMES[TeamId.TeamAC]}
              </h3>
            </div>
            <span className="text-xs text-blue-300/80 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/40">
              Seats A &amp; C
            </span>
          </div>

          <div className="space-y-4">
            {[0, 2].map((sIndex) => {
              const seat = sIndex as SeatIndex;
              const occupant = room.players.find((p) => p.seatIndex === seat);
              const isMe = mySeatIndex === seat;

              return (
                <div
                  key={seat}
                  onClick={() => !occupant && selectSeat(seat)}
                  className={`
                    p-4 rounded-xl border transition-all duration-200
                    ${
                      isMe
                        ? 'bg-blue-900/30 border-blue-500 ring-1 ring-blue-400/50 shadow-md'
                        : occupant
                        ? 'bg-charcoal-800/60 border-charcoal-700/60'
                        : 'bg-charcoal-800/20 border-dashed border-charcoal-700/60 hover:border-blue-400/60 hover:bg-blue-950/20 cursor-pointer'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800/60 flex items-center justify-center font-display font-black text-blue-400 text-lg">
                        {SEAT_LABELS[seat]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ivory-100">
                            {occupant ? occupant.name : 'Open Seat'}
                          </span>
                          {isMe && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/40">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-400">
                          {occupant
                            ? occupant.isConnected
                              ? 'Connected'
                              : 'Disconnected'
                            : 'Click to select this seat'}
                        </p>
                      </div>
                    </div>

                    {occupant ? (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                          occupant.isReady
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                            : 'bg-charcoal-800 text-charcoal-400 border-charcoal-700'
                        }`}
                      >
                        {occupant.isReady ? '✓ Ready' : 'Waiting'}
                      </span>
                    ) : (
                      <button
                        onClick={() => selectSeat(seat)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 transition-colors"
                      >
                        Take Seat
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team BD Column */}
        <div className="glass-panel p-5 border-amber-900/40 bg-gradient-to-b from-amber-950/20 to-charcoal-900/60">
          <div className="flex items-center justify-between border-b border-amber-900/40 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <h3 className="font-display font-bold text-lg text-amber-400">
                {TEAM_NAMES[TeamId.TeamBD]}
              </h3>
            </div>
            <span className="text-xs text-amber-300/80 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
              Seats B &amp; D
            </span>
          </div>

          <div className="space-y-4">
            {[1, 3].map((sIndex) => {
              const seat = sIndex as SeatIndex;
              const occupant = room.players.find((p) => p.seatIndex === seat);
              const isMe = mySeatIndex === seat;

              return (
                <div
                  key={seat}
                  onClick={() => !occupant && selectSeat(seat)}
                  className={`
                    p-4 rounded-xl border transition-all duration-200
                    ${
                      isMe
                        ? 'bg-amber-900/30 border-amber-500 ring-1 ring-amber-400/50 shadow-md'
                        : occupant
                        ? 'bg-charcoal-800/60 border-charcoal-700/60'
                        : 'bg-charcoal-800/20 border-dashed border-charcoal-700/60 hover:border-amber-400/60 hover:bg-amber-950/20 cursor-pointer'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/60 flex items-center justify-center font-display font-black text-amber-400 text-lg">
                        {SEAT_LABELS[seat]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ivory-100">
                            {occupant ? occupant.name : 'Open Seat'}
                          </span>
                          {isMe && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-400">
                          {occupant
                            ? occupant.isConnected
                              ? 'Connected'
                              : 'Disconnected'
                            : 'Click to select this seat'}
                        </p>
                      </div>
                    </div>

                    {occupant ? (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                          occupant.isReady
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                            : 'bg-charcoal-800 text-charcoal-400 border-charcoal-700'
                        }`}
                      >
                        {occupant.isReady ? '✓ Ready' : 'Waiting'}
                      </span>
                    ) : (
                      <button
                        onClick={() => selectSeat(seat)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 transition-colors"
                      >
                        Take Seat
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-display font-semibold text-ivory-100">
            Players in Lobby: {room.players.length} / 4
          </h4>
          <p className="text-xs text-charcoal-400">
            {!isFull
              ? `Waiting for ${4 - room.players.length} more player(s)...`
              : !allReady
              ? 'Waiting for all 4 players to mark Ready...'
              : 'All players ready! Ready to start.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Toggle Ready Button */}
          <button
            onClick={toggleReady}
            className={`
              flex-1 sm:flex-none px-6 py-3 rounded-xl font-display font-semibold text-sm transition-all
              ${
                isReady
                  ? 'bg-charcoal-700 text-ivory-200 border border-charcoal-600 hover:bg-charcoal-600'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
              }
            `}
          >
            {isReady ? '✓ You Are Ready' : 'Mark as Ready'}
          </button>

          {/* Start Game Button */}
          <button
            onClick={startGame}
            disabled={!allReady}
            className={`
              flex-1 sm:flex-none btn-primary text-sm
              ${!allReady ? 'opacity-40 cursor-not-allowed' : 'animate-pulse'}
            `}
          >
            Start Game 🎴
          </button>
        </div>
      </div>
    </div>
  );
};

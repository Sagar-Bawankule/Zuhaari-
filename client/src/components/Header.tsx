import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const Header: React.FC = () => {
  const {
    roomCode,
    isConnected,
    isReconnecting,
    soundMuted,
    toggleMute,
    leaveRoom,
    setShowRulesModal,
  } = useGameStore();

  const [copied, setCopied] = useState(false);

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

  return (
    <header className="w-full bg-charcoal-900/80 backdrop-blur-md border-b border-charcoal-800/80 px-4 py-3 z-30 sticky top-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-charcoal-950 font-display font-extrabold text-xl shadow-glow-gold/30">
            🎴
          </div>
          <div>
            <h1 className="font-display font-black text-lg sm:text-xl tracking-wider text-ivory-100 flex items-center gap-1.5 leading-tight">
              ZUHAARI
              <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 font-sans font-medium border border-gold-500/30">
                36 Cards
              </span>
            </h1>
            <p className="text-[11px] text-charcoal-400 hidden sm:block">
              Multiplayer Trick-Taking Card Game
            </p>
          </div>
        </div>

        {/* Center: Room Code badge if in room */}
        {roomCode && (
          <div className="flex items-center gap-2 bg-charcoal-800/80 border border-charcoal-700/60 rounded-xl px-3 py-1.5">
            <span className="text-xs text-charcoal-400 font-medium">Room:</span>
            <span className="font-mono font-bold text-gold-400 tracking-widest text-sm sm:text-base">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copy Room Code"
              className="text-xs px-2 py-1 rounded-md bg-charcoal-700/80 hover:bg-gold-500/20 text-ivory-100 transition-colors border border-charcoal-600/50"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        )}

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {/* Connection status indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected && !isReconnecting
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                : 'bg-amber-950/60 text-amber-400 border-amber-800/40 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected && !isReconnecting ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="hidden md:inline">
              {isConnected && !isReconnecting ? 'Connected' : 'Reconnecting...'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            aria-label={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
            title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-9 h-9 rounded-xl bg-charcoal-800/80 hover:bg-charcoal-700 text-ivory-200 border border-charcoal-700 flex items-center justify-center transition-colors text-sm"
          >
            {soundMuted ? '🔇' : '🔊'}
          </button>

          {/* Rules Button */}
          <button
            onClick={() => setShowRulesModal(true)}
            aria-label="How to play rules"
            title="How to play"
            className="px-3 h-9 rounded-xl bg-charcoal-800/80 hover:bg-charcoal-700 text-ivory-200 border border-charcoal-700 flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <span>📖</span>
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* Leave Room Button */}
          {roomCode && (
            <button
              onClick={leaveRoom}
              title="Leave Room"
              className="px-3 h-9 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 flex items-center gap-1 text-xs font-medium transition-colors"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

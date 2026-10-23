import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useCutpattiStore } from '../store/cutpattiStore';
import { useAppStore } from '../store/appStore';
import { GameSelector } from './GameSelector';

export const Header: React.FC = () => {
  const { gameMode } = useAppStore();

  // Zuhaari state
  const zuhaariRoomCode = useGameStore((s) => s.roomCode);
  const zuhaariConnected = useGameStore((s) => s.isConnected);
  const zuhaariReconnecting = useGameStore((s) => s.isReconnecting);
  const zuhaariMuted = useGameStore((s) => s.soundMuted);
  const zuhaariToggleMute = useGameStore((s) => s.toggleMute);
  const zuhaariLeaveRoom = useGameStore((s) => s.leaveRoom);
  const zuhaariSetShowRules = useGameStore((s) => s.setShowRulesModal);

  // Cutpatti state
  const cutpattiRoomCode = useCutpattiStore((s) => s.roomCode);
  const cutpattiConnected = useCutpattiStore((s) => s.isConnected);
  const cutpattiReconnecting = useCutpattiStore((s) => s.isReconnecting);
  const cutpattiMuted = useCutpattiStore((s) => s.soundMuted);
  const cutpattiToggleMute = useCutpattiStore((s) => s.toggleMute);
  const cutpattiLeaveRoom = useCutpattiStore((s) => s.leaveRoom);
  const cutpattiSetShowRules = useCutpattiStore((s) => s.setShowRulesModal);

  const isCutpatti = gameMode === 'cutpatti';
  const currentRoomCode = isCutpatti ? cutpattiRoomCode : zuhaariRoomCode;
  const isConnected = isCutpatti ? cutpattiConnected : zuhaariConnected;
  const isReconnecting = isCutpatti ? cutpattiReconnecting : zuhaariReconnecting;
  const soundMuted = isCutpatti ? cutpattiMuted : zuhaariMuted;
  const toggleMute = isCutpatti ? cutpattiToggleMute : zuhaariToggleMute;
  const leaveRoom = isCutpatti ? cutpattiLeaveRoom : zuhaariLeaveRoom;
  const setShowRules = isCutpatti ? cutpattiSetShowRules : zuhaariSetShowRules;

  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!currentRoomCode) return;
    try {
      await navigator.clipboard.writeText(currentRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <header className="w-full bg-charcoal-900/90 backdrop-blur-md border-b border-charcoal-800/80 px-2 sm:px-4 py-2 z-30 sticky top-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center font-display font-extrabold text-base sm:text-xl shadow-md ${
              isCutpatti
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-charcoal-950 shadow-emerald-950/30'
                : 'bg-gradient-to-br from-gold-400 to-gold-600 text-charcoal-950 shadow-gold-950/30'
            }`}
          >
            {isCutpatti ? '🃏' : '🎴'}
          </div>
          <div>
            <h1 className="font-display font-black text-sm sm:text-lg tracking-wider text-ivory-100 flex items-center gap-1 leading-tight">
              {isCutpatti ? 'CUTPATTI' : 'ZUHAARI'}
              <span
                className={`text-[9px] sm:text-xs px-1.5 py-0.2 rounded-full font-sans font-medium border hidden xs:inline ${
                  isCutpatti
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-gold-500/20 text-gold-400 border-gold-500/30'
                }`}
              >
                {isCutpatti ? '52' : '36'}
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Game Selector & Active Room Code */}
        <div className="flex items-center gap-2">
          {/* Game Selector prominently displayed */}
          <GameSelector />

          {/* Active Room Code badge if in room */}
          {currentRoomCode && (
            <div className="hidden md:flex items-center gap-1 sm:gap-2 bg-charcoal-800/80 border border-charcoal-700/60 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1">
              <span className="text-[10px] sm:text-xs text-charcoal-400 font-medium">
                Room:
              </span>
              <span
                className={`font-mono font-bold tracking-wider text-xs sm:text-sm ${
                  isCutpatti ? 'text-emerald-400' : 'text-gold-400'
                }`}
              >
                {currentRoomCode}
              </span>
              <button
                onClick={handleCopyCode}
                title="Copy Room Code"
                className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-charcoal-700/80 hover:bg-charcoal-600 text-ivory-100 transition-colors border border-charcoal-600/50"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Connection status dot */}
          <div
            title={isConnected && !isReconnecting ? 'Connected' : 'Reconnecting...'}
            className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-full text-xs font-medium border ${
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
            <span className="hidden lg:inline text-[11px]">
              {isConnected && !isReconnecting ? 'Live' : 'Reconnecting'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            aria-label={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
            title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-charcoal-800/80 hover:bg-charcoal-700 text-ivory-200 border border-charcoal-700 flex items-center justify-center transition-colors text-xs sm:text-sm"
          >
            {soundMuted ? '🔇' : '🔊'}
          </button>

          {/* Rules Button */}
          <button
            onClick={() => setShowRules(true)}
            aria-label="How to play rules"
            title="How to play"
            className="w-7 h-7 sm:w-auto sm:px-3 sm:h-9 rounded-lg sm:rounded-xl bg-charcoal-800/80 hover:bg-charcoal-700 text-ivory-200 border border-charcoal-700 flex items-center justify-center gap-1 text-xs font-medium transition-colors"
          >
            <span>📖</span>
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* Leave Room Button */}
          {currentRoomCode && (
            <button
              onClick={leaveRoom}
              title="Leave Room"
              className="w-7 h-7 sm:w-auto sm:px-3 sm:h-9 rounded-lg sm:rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 flex items-center justify-center gap-1 text-xs font-medium transition-colors"
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

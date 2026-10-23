import React from 'react';
import { useAppStore, GameMode } from '../store/appStore';
import { useGameStore } from '../store/gameStore';
import { useCutpattiStore } from '../store/cutpattiStore';

interface GameSelectorProps {
  className?: string;
}

export const GameSelector: React.FC<GameSelectorProps> = ({ className = '' }) => {
  const { gameMode, setGameMode } = useAppStore();
  const zuhaariRoomCode = useGameStore((s) => s.roomCode);
  const cutpattiRoomCode = useCutpattiStore((s) => s.roomCode);

  const handleSelect = (mode: GameMode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
  };

  return (
    <div
      className={`inline-flex items-center p-1 rounded-2xl bg-charcoal-900/90 border border-charcoal-700/80 shadow-lg backdrop-blur-md ${className}`}
      role="tablist"
      aria-label="Game Mode Selector"
    >
      {/* Zuhaari Button */}
      <button
        type="button"
        role="tab"
        aria-selected={gameMode === 'zuhaari'}
        onClick={() => handleSelect('zuhaari')}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-display font-bold transition-all relative ${
          gameMode === 'zuhaari'
            ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 shadow-md shadow-gold-950/40'
            : 'text-charcoal-400 hover:text-ivory-200 hover:bg-charcoal-800/60'
        }`}
      >
        <span className="text-base sm:text-lg">🎴</span>
        <div className="flex flex-col items-start leading-none">
          <span className="tracking-wider">ZUHAARI</span>
          <span
            className={`text-[9px] font-sans font-medium hidden sm:inline ${
              gameMode === 'zuhaari' ? 'text-charcoal-900' : 'text-charcoal-500'
            }`}
          >
            4P &bull; Teams &bull; 36 Cards
          </span>
        </div>
        {zuhaariRoomCode && (
          <span className="w-2 h-2 rounded-full bg-gold-400 ml-1 animate-pulse" title="Active Zuhaari Room" />
        )}
      </button>

      {/* Cutpatti Button */}
      <button
        type="button"
        role="tab"
        aria-selected={gameMode === 'cutpatti'}
        onClick={() => handleSelect('cutpatti')}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-display font-bold transition-all relative ${
          gameMode === 'cutpatti'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-charcoal-950 shadow-md shadow-emerald-950/40'
            : 'text-charcoal-400 hover:text-ivory-200 hover:bg-charcoal-800/60'
        }`}
      >
        <span className="text-base sm:text-lg">🃏</span>
        <div className="flex flex-col items-start leading-none">
          <span className="tracking-wider">CUTPATTI</span>
          <span
            className={`text-[9px] font-sans font-medium hidden sm:inline ${
              gameMode === 'cutpatti' ? 'text-charcoal-900' : 'text-emerald-500/70'
            }`}
          >
            3–6P &bull; Solo &bull; 52 Cards
          </span>
        </div>
        {cutpattiRoomCode && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1 animate-pulse" title="Active Cutpatti Room" />
        )}
      </button>
    </div>
  );
};

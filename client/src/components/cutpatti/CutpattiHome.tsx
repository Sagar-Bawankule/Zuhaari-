import React, { useState } from 'react';
import { useCutpattiStore } from '../../store/cutpattiStore';
import {
  CUTPATTI_MIN_PLAYER_NAME_LENGTH,
  CUTPATTI_MAX_PLAYER_NAME_LENGTH,
  CUTPATTI_ROOM_CODE_LENGTH,
} from '@shared/cutpatti/constants';

interface CutpattiHomeProps {
  onSwitchToZuhaari?: () => void;
}

export const CutpattiHome: React.FC<CutpattiHomeProps> = ({ onSwitchToZuhaari }) => {
  const {
    playerName,
    setPlayerName,
    createRoom,
    joinRoom,
    error,
    setError,
    setShowRulesModal,
  } = useCutpattiStore();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [nameInput, setNameInput] = useState(playerName || '');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const validateName = (name: string): boolean => {
    const trimmed = name.trim();
    if (trimmed.length < CUTPATTI_MIN_PLAYER_NAME_LENGTH) {
      setLocalError(`Name must be at least ${CUTPATTI_MIN_PLAYER_NAME_LENGTH} characters`);
      return false;
    }
    if (trimmed.length > CUTPATTI_MAX_PLAYER_NAME_LENGTH) {
      setLocalError(`Name must be at most ${CUTPATTI_MAX_PLAYER_NAME_LENGTH} characters`);
      return false;
    }
    return true;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (!validateName(nameInput)) return;
    createRoom(nameInput.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (!validateName(nameInput)) return;

    const trimmedCode = roomCodeInput.trim().toUpperCase();
    if (trimmedCode.length !== CUTPATTI_ROOM_CODE_LENGTH) {
      setLocalError(`Room code must be exactly ${CUTPATTI_ROOM_CODE_LENGTH} characters`);
      return;
    }

    joinRoom(trimmedCode, nameInput.trim());
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-12 flex flex-col items-center justify-center animate-fade-in">
      {/* Brand Hero */}
      <div className="text-center mb-6 sm:mb-10">
        <div className="inline-flex items-center justify-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold tracking-wider uppercase">
          <span>♠</span>
          <span>♥</span>
          <span>3–6 Players Multiplayer</span>
          <span>♦</span>
          <span>♣</span>
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-ivory-100 via-emerald-300 to-teal-400 drop-shadow-lg mb-3">
          CUTPATTI
        </h1>

        <p className="text-sm sm:text-base text-charcoal-300 max-w-lg mx-auto leading-relaxed">
          The ultimate variable-player trick-taking card game. 3 to 6 individual players, 52-card deck, dynamic hand distribution, random trump suits, and Call Break scoring.
        </p>
      </div>

      {/* Main Action Box */}
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 border-emerald-500/30 shadow-2xl relative">
        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1 bg-charcoal-900/80 rounded-xl mb-6 border border-charcoal-700/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setLocalError(null);
              setError(null);
            }}
            className={`py-2 text-xs sm:text-sm font-display font-bold rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-charcoal-950 shadow-md font-black'
                : 'text-charcoal-400 hover:text-ivory-200'
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('join');
              setLocalError(null);
              setError(null);
            }}
            className={`py-2 text-xs sm:text-sm font-display font-bold rounded-lg transition-all ${
              activeTab === 'join'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-charcoal-950 shadow-md font-black'
                : 'text-charcoal-400 hover:text-ivory-200'
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Errors display */}
        {(localError || error) && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs text-center animate-fade-in">
            {localError || error}
          </div>
        )}

        {/* Create Room Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                Your Player Name
              </label>
              <input
                type="text"
                placeholder="e.g. MasterCut"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setPlayerName(e.target.value);
                }}
                maxLength={CUTPATTI_MAX_PLAYER_NAME_LENGTH}
                required
                className="input-field w-full"
              />
              <span className="text-[11px] text-charcoal-500 mt-1 block">
                2 to 16 characters
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-charcoal-950 shadow-lg shadow-emerald-950/40 transition-all transform active:scale-98"
            >
              Create Cutpatti Room 🃏
            </button>
          </form>
        )}

        {/* Join Room Form */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                Your Player Name
              </label>
              <input
                type="text"
                placeholder="e.g. MasterCut"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setPlayerName(e.target.value);
                }}
                maxLength={CUTPATTI_MAX_PLAYER_NAME_LENGTH}
                required
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                6-Character Room Code
              </label>
              <input
                type="text"
                placeholder="e.g. CP4XYZ"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={CUTPATTI_ROOM_CODE_LENGTH}
                required
                className="input-field w-full font-mono uppercase tracking-widest text-center text-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-charcoal-950 shadow-lg shadow-emerald-950/40 transition-all transform active:scale-98"
            >
              Join Cutpatti Room 🚪
            </button>
          </form>
        )}

        {/* How to play trigger link */}
        <div className="mt-6 pt-4 border-t border-charcoal-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium underline underline-offset-4"
          >
            How to play Cutpatti &rarr;
          </button>
          {onSwitchToZuhaari && (
            <button
              type="button"
              onClick={onSwitchToZuhaari}
              className="text-charcoal-400 hover:text-gold-400 transition-colors"
            >
              Play Zuhaari &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mt-10 w-full text-center">
        <div className="glass-panel p-3 border-emerald-900/40">
          <span className="text-xl sm:text-2xl block mb-1">👥</span>
          <span className="text-xs font-bold text-ivory-100 block">3–6 Players</span>
          <span className="text-[11px] text-charcoal-400">No bots needed</span>
        </div>
        <div className="glass-panel p-3 border-emerald-900/40">
          <span className="text-xl sm:text-2xl block mb-1">🎴</span>
          <span className="text-xs font-bold text-ivory-100 block">52 Cards</span>
          <span className="text-[11px] text-charcoal-400">Dynamic distribution</span>
        </div>
        <div className="glass-panel p-3 border-emerald-900/40">
          <span className="text-xl sm:text-2xl block mb-1">🎲</span>
          <span className="text-xs font-bold text-ivory-100 block">Random Trump</span>
          <span className="text-[11px] text-charcoal-400">Server picked suit</span>
        </div>
        <div className="glass-panel p-3 border-emerald-900/40">
          <span className="text-xl sm:text-2xl block mb-1">📊</span>
          <span className="text-xs font-bold text-ivory-100 block">Call Break Scoring</span>
          <span className="text-[11px] text-charcoal-400">+0.1 overtricks</span>
        </div>
      </div>
    </div>
  );
};

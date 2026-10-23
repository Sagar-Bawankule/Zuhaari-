import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  MIN_PLAYER_NAME_LENGTH,
  MAX_PLAYER_NAME_LENGTH,
  ROOM_CODE_LENGTH,
} from '@shared/constants';

export const Home: React.FC = () => {
  const {
    playerName,
    setPlayerName,
    createRoom,
    joinRoom,
    error,
    setError,
    setShowRulesModal,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [nameInput, setNameInput] = useState(playerName || '');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const validateName = (name: string): boolean => {
    const trimmed = name.trim();
    if (trimmed.length < MIN_PLAYER_NAME_LENGTH) {
      setLocalError(`Name must be at least ${MIN_PLAYER_NAME_LENGTH} characters`);
      return false;
    }
    if (trimmed.length > MAX_PLAYER_NAME_LENGTH) {
      setLocalError(`Name must be at most ${MAX_PLAYER_NAME_LENGTH} characters`);
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
    if (trimmedCode.length !== ROOM_CODE_LENGTH) {
      setLocalError(`Room code must be exactly ${ROOM_CODE_LENGTH} characters`);
      return;
    }

    joinRoom(trimmedCode, nameInput.trim());
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-16 flex flex-col items-center justify-center animate-fade-in">
      {/* Brand Hero */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs sm:text-sm font-semibold tracking-wider uppercase">
          <span>♠</span>
          <span>♥</span>
          <span>Real-Time Multiplayer</span>
          <span>♦</span>
          <span>♣</span>
        </div>

        <h1 className="font-display font-black text-5xl sm:text-6xl md:text-7xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-ivory-100 via-gold-300 to-gold-500 drop-shadow-lg mb-3">
          ZUHAARI
        </h1>

        <p className="text-sm sm:text-base text-charcoal-300 max-w-md mx-auto leading-relaxed">
          The classic 4-player team trick-taking card game. Team AC versus Team BD with a 36-card deck and strategic Cutt mechanics.
        </p>
      </div>

      {/* Main Action Box */}
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 border-gold-500/30 shadow-2xl relative">
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
                ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-charcoal-950 shadow-md'
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
                ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-charcoal-950 shadow-md'
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
                placeholder="e.g. AcePlayer"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setPlayerName(e.target.value);
                }}
                maxLength={MAX_PLAYER_NAME_LENGTH}
                required
                className="input-field w-full"
              />
              <span className="text-[11px] text-charcoal-500 mt-1 block">
                2 to 16 characters
              </span>
            </div>

            <button type="submit" className="btn-primary w-full mt-2">
              Create New Room 🎴
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
                placeholder="e.g. AcePlayer"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setPlayerName(e.target.value);
                }}
                maxLength={MAX_PLAYER_NAME_LENGTH}
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
                placeholder="e.g. ZUH123"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={ROOM_CODE_LENGTH}
                required
                className="input-field w-full font-mono uppercase tracking-widest text-center text-lg"
              />
            </div>

            <button type="submit" className="btn-primary w-full mt-2">
              Join Room 🚪
            </button>
          </form>
        )}

        {/* How to play trigger link */}
        <div className="mt-6 pt-4 border-t border-charcoal-800 text-center">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="text-xs text-gold-400 hover:text-gold-300 transition-colors font-medium underline underline-offset-4"
          >
            New to Zuhaari? Read the Game Rules &rarr;
          </button>
        </div>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mt-12 w-full text-center">
        <div className="glass-panel p-3 border-charcoal-700/50">
          <span className="text-xl sm:text-2xl block mb-1">👥</span>
          <span className="text-xs font-bold text-ivory-100 block">4 Players</span>
          <span className="text-[11px] text-charcoal-400">Team AC vs BD</span>
        </div>
        <div className="glass-panel p-3 border-charcoal-700/50">
          <span className="text-xl sm:text-2xl block mb-1">🃏</span>
          <span className="text-xs font-bold text-ivory-100 block">36 Cards</span>
          <span className="text-[11px] text-charcoal-400">Ranks 6 to Ace</span>
        </div>
        <div className="glass-panel p-3 border-charcoal-700/50">
          <span className="text-xl sm:text-2xl block mb-1">⚡</span>
          <span className="text-xs font-bold text-ivory-100 block">Cutt Mechanics</span>
          <span className="text-[11px] text-charcoal-400">Target 5 or 6</span>
        </div>
        <div className="glass-panel p-3 border-charcoal-700/50">
          <span className="text-xl sm:text-2xl block mb-1">🔒</span>
          <span className="text-xs font-bold text-ivory-100 block">Private Rooms</span>
          <span className="text-[11px] text-charcoal-400">Server validated</span>
        </div>
      </div>
    </div>
  );
};

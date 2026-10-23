import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { GameTable } from './components/GameTable';
import { CuttModal } from './components/CuttModal';
import { RoundResultModal } from './components/RoundResultModal';
import { RulesModal } from './components/RulesModal';
import { RoomStatus } from '@shared/types/index';

export const App: React.FC = () => {
  const {
    room,
    roomCode,
    notification,
    error,
    setError,
    setNotification,
    initSocketListeners,
  } = useGameStore();

  useEffect(() => {
    initSocketListeners();
  }, [initSocketListeners]);

  // Determine active screen
  const isInRoom = Boolean(roomCode && room);
  const isPlaying =
    isInRoom &&
    (room?.status === RoomStatus.InGame || room?.status === RoomStatus.Finished);

  return (
    <div className="min-h-screen bg-charcoal-950 text-white font-body flex flex-col justify-between selection:bg-gold-500/30 selection:text-gold-200">
      {/* Top Header */}
      <Header />

      {/* Floating Notifications / Toasts */}
      {(notification || error) && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md animate-slide-up pointer-events-none">
          <div
            className={`p-3.5 rounded-2xl shadow-2xl text-center text-xs sm:text-sm font-semibold backdrop-blur-md border pointer-events-auto flex items-center justify-between gap-3 ${
              error
                ? 'bg-red-950/90 text-red-200 border-red-700/80 shadow-red-950/40'
                : 'bg-gold-950/90 text-gold-200 border-gold-600/80 shadow-gold-950/40'
            }`}
          >
            <span>{error || notification}</span>
            <button
              onClick={() => {
                if (error) setError(null);
                else setNotification(null);
              }}
              className="text-xs opacity-70 hover:opacity-100 px-1 py-0.5 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        {!isInRoom ? (
          <Home />
        ) : isPlaying ? (
          <>
            <GameTable />
            <CuttModal />
            <RoundResultModal />
          </>
        ) : (
          <Lobby />
        )}
      </main>

      {/* Rules Modal (Globally Accessible) */}
      <RulesModal />

      {/* Footer (hidden during gameplay for clean responsive viewport) */}
      {!isPlaying && (
        <footer className="w-full border-t border-charcoal-900 py-3 text-center text-xs text-charcoal-500">
          Zuhaari — 4-Player Real-Time Multiplayer Card Game &bull; Server-Authoritative &bull; 36 Cards
        </footer>
      )}
    </div>
  );
};

export default App;

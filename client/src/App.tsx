import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useCutpattiStore } from './store/cutpattiStore';
import { useAppStore } from './store/appStore';
import { Header } from './components/Header';

// Zuhaari components
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { GameTable } from './components/GameTable';
import { CuttModal } from './components/CuttModal';
import { RoundResultModal } from './components/RoundResultModal';
import { RulesModal } from './components/RulesModal';

// Cutpatti components
import { CutpattiHome } from './components/cutpatti/CutpattiHome';
import { CutpattiLobby } from './components/cutpatti/CutpattiLobby';
import { CutpattiGameTable } from './components/cutpatti/CutpattiGameTable';
import { CutpattiRulesModal } from './components/cutpatti/CutpattiRulesModal';

import { RoomStatus } from '@shared/types/index';

export const App: React.FC = () => {
  const { gameMode, setGameMode } = useAppStore();

  // Zuhaari store hooks
  const {
    room: zuhaariRoom,
    roomCode: zuhaariRoomCode,
    notification: zuhaariNotification,
    error: zuhaariError,
    setError: setZuhaariError,
    setNotification: setZuhaariNotification,
    initSocketListeners: initZuhaariListeners,
  } = useGameStore();

  // Cutpatti store hooks
  const {
    room: cutpattiRoom,
    roomCode: cutpattiRoomCode,
    notification: cutpattiNotification,
    error: cutpattiError,
    setError: setCutpattiError,
    setNotification: setCutpattiNotification,
    initSocketListeners: initCutpattiListeners,
  } = useCutpattiStore();

  useEffect(() => {
    initZuhaariListeners();
    initCutpattiListeners();
  }, [initZuhaariListeners, initCutpattiListeners]);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('cutpatti')) setGameMode('cutpatti');
      if (hash.includes('zuhaari')) setGameMode('zuhaari');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setGameMode]);

  // Determine active Zuhaari screens
  const isInZuhaariRoom = Boolean(zuhaariRoomCode && zuhaariRoom);
  const isZuhaariPlaying =
    isInZuhaariRoom &&
    (zuhaariRoom?.status === RoomStatus.InGame || zuhaariRoom?.status === RoomStatus.Finished);

  // Determine active Cutpatti screens
  const isInCutpattiRoom = Boolean(cutpattiRoomCode && cutpattiRoom);
  const isCutpattiPlaying =
    isInCutpattiRoom &&
    (cutpattiRoom?.status === RoomStatus.InGame || cutpattiRoom?.status === RoomStatus.Finished);

  const isCutpatti = gameMode === 'cutpatti';
  const activeError = isCutpatti ? cutpattiError : zuhaariError;
  const activeNotification = isCutpatti ? cutpattiNotification : zuhaariNotification;
  const isPlayingActive = isCutpatti ? isCutpattiPlaying : isZuhaariPlaying;

  return (
    <div className="min-h-screen bg-charcoal-950 text-white font-body flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <Header />

      {/* Floating Notifications / Toasts */}
      {(activeNotification || activeError) && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md animate-slide-up pointer-events-none">
          <div
            className={`p-3.5 rounded-2xl shadow-2xl text-center text-xs sm:text-sm font-semibold backdrop-blur-md border pointer-events-auto flex items-center justify-between gap-3 ${
              activeError
                ? 'bg-red-950/90 text-red-200 border-red-700/80 shadow-red-950/40'
                : isCutpatti
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-600/80 shadow-emerald-950/40'
                : 'bg-gold-950/90 text-gold-200 border-gold-600/80 shadow-gold-950/40'
            }`}
          >
            <span>{activeError || activeNotification}</span>
            <button
              onClick={() => {
                if (isCutpatti) {
                  if (activeError) setCutpattiError(null);
                  else setCutpattiNotification(null);
                } else {
                  if (activeError) setZuhaariError(null);
                  else setZuhaariNotification(null);
                }
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
        {isCutpatti ? (
          // ─── Cutpatti Screens ────────────────────────────────
          !isInCutpattiRoom ? (
            <CutpattiHome onSwitchToZuhaari={() => setGameMode('zuhaari')} />
          ) : isCutpattiPlaying ? (
            <CutpattiGameTable />
          ) : (
            <CutpattiLobby />
          )
        ) : (
          // ─── Zuhaari Screens ─────────────────────────────────
          !isInZuhaariRoom ? (
            <Home />
          ) : isZuhaariPlaying ? (
            <>
              <GameTable />
              <CuttModal />
              <RoundResultModal />
            </>
          ) : (
            <Lobby />
          )
        )}
      </main>

      {/* Modals */}
      <RulesModal />
      <CutpattiRulesModal />

      {/* Footer */}
      {!isPlayingActive && (
        <footer className="w-full border-t border-charcoal-900 py-3 text-center text-xs text-charcoal-500">
          {isCutpatti
            ? 'Cutpatti — 3–6 Player Trick-Taking Card Game • 52 Cards • Server-Authoritative • Call Break Scoring'
            : 'Zuhaari — 4-Player Team Trick-Taking Card Game • 36 Cards • Server-Authoritative'}
        </footer>
      )}
    </div>
  );
};

export default App;

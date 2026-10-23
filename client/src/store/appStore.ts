import { create } from 'zustand';

export type GameMode = 'zuhaari' | 'cutpatti';

interface AppStore {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
}

const STORAGE_KEY_MODE = 'selected_game_mode';

function getInitialMode(): GameMode {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('cutpatti')) return 'cutpatti';
  if (hash.includes('zuhaari')) return 'zuhaari';

  const saved = localStorage.getItem(STORAGE_KEY_MODE);
  if (saved === 'cutpatti' || saved === 'zuhaari') return saved;

  return 'zuhaari';
}

export const useAppStore = create<AppStore>((set) => ({
  gameMode: getInitialMode(),
  setGameMode: (mode: GameMode) => {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
    window.location.hash = mode;
    set({ gameMode: mode });
  },
}));

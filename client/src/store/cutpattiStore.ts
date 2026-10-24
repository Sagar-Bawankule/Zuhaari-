import { create } from 'zustand';
import { socket } from '../lib/socket';
import { sounds } from '../lib/sound';
import {
  CutpattiClientEvent,
  CutpattiServerEvent,
  CutpattiRoomCreatedPayload,
  CutpattiRoomJoinedPayload,
  CutpattiRoomErrorPayload,
  CutpattiGameErrorPayload,
} from '@shared/cutpatti/events';
import {
  CutpattiClientGameState,
  CutpattiClientRoom,
  CutpattiCompletedTrick,
  CutpattiPlayedCard,
  CutpattiPublicPlayer,
  CutpattiRoundResult,
} from '@shared/cutpatti/types';

interface CutpattiStore {
  // Connection & Auth
  playerName: string;
  roomCode: string | null;
  sessionToken: string | null;
  myPlayerId: string | null;
  isConnected: boolean;
  isReconnecting: boolean;

  // Room & Game
  room: CutpattiClientRoom | null;
  gameState: CutpattiClientGameState | null;
  lastTrickResult: CutpattiCompletedTrick | null;
  roundResult: CutpattiRoundResult | null;
  trickNotice: string | null;

  // UI state
  error: string | null;
  notification: string | null;
  soundMuted: boolean;
  showRulesModal: boolean;

  // Computed helper getters
  getMyPlayer: () => CutpattiPublicPlayer | null;
  isHost: () => boolean;
  isMyTurn: () => boolean;
  hasSubmittedBid: () => boolean;

  // Actions
  setPlayerName: (name: string) => void;
  createRoom: (playerName: string) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  leaveRoom: () => void;
  toggleReady: () => void;
  startGame: () => void;
  submitBid: (bid: number) => void;
  playCard: (cardId: string) => void;
  nextRound: () => void;
  setError: (msg: string | null) => void;
  setNotification: (msg: string | null) => void;
  toggleMute: () => void;
  setShowRulesModal: (show: boolean) => void;
  initSocketListeners: () => void;
}

const STORAGE_KEY_NAME = 'cutpatti_name';
const STORAGE_KEY_ROOM = 'cutpatti_room';
const STORAGE_KEY_SESSION = 'cutpatti_session';

export const useCutpattiStore = create<CutpattiStore>((set, get) => ({
  playerName: localStorage.getItem(STORAGE_KEY_NAME) || '',
  roomCode: localStorage.getItem(STORAGE_KEY_ROOM) || null,
  sessionToken: localStorage.getItem(STORAGE_KEY_SESSION) || null,
  myPlayerId: null,
  isConnected: socket.connected,
  isReconnecting: false,

  room: null,
  gameState: null,
  lastTrickResult: null,
  roundResult: null,
  trickNotice: null,

  error: null,
  notification: null,
  soundMuted: sounds.getIsMuted(),
  showRulesModal: false,

  getMyPlayer: () => {
    const { room, myPlayerId } = get();
    if (!room || !myPlayerId) return null;
    return room.players.find((p) => p.id === myPlayerId) || null;
  },

  isHost: () => {
    const { room, myPlayerId } = get();
    if (!room || !myPlayerId) return false;
    return room.hostId === myPlayerId;
  },

  isMyTurn: () => {
    const { gameState, getMyPlayer } = get();
    const myPlayer = getMyPlayer();
    if (!gameState || !myPlayer) return false;
    return gameState.currentTurnSeat === myPlayer.seatIndex;
  },

  hasSubmittedBid: () => {
    const { gameState, myPlayerId } = get();
    if (!gameState || !myPlayerId) return false;
    return typeof gameState.bids[myPlayerId] === 'number';
  },

  setPlayerName: (name: string) => {
    localStorage.setItem(STORAGE_KEY_NAME, name);
    set({ playerName: name });
  },

  createRoom: (name: string) => {
    get().setPlayerName(name);
    set({ error: null, notification: 'Creating Cutpatti room...' });
    socket.emit(CutpattiClientEvent.CreateRoom, { playerName: name });
  },

  joinRoom: (code: string, name: string) => {
    get().setPlayerName(name);
    set({ error: null, notification: `Joining room ${code}...` });
    socket.emit(CutpattiClientEvent.JoinRoom, { roomCode: code, playerName: name });
  },

  leaveRoom: () => {
    socket.emit(CutpattiClientEvent.LeaveRoom);
    localStorage.removeItem(STORAGE_KEY_ROOM);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    set({
      roomCode: null,
      sessionToken: null,
      room: null,
      gameState: null,
      lastTrickResult: null,
      roundResult: null,
      trickNotice: null,
      error: null,
      notification: null,
    });
  },

  toggleReady: () => {
    socket.emit(CutpattiClientEvent.ToggleReady);
  },

  startGame: () => {
    set({ error: null, notification: 'Starting game...' });
    socket.emit(CutpattiClientEvent.StartGame);
  },

  submitBid: (bid: number) => {
    socket.emit(CutpattiClientEvent.SubmitBid, { bid });
  },

  playCard: (cardId: string) => {
    sounds.playCardPlay();
    socket.emit(CutpattiClientEvent.PlayCard, { cardId });
  },

  nextRound: () => {
    set({ roundResult: null, lastTrickResult: null });
    socket.emit(CutpattiClientEvent.NextRound);
  },

  setError: (msg: string | null) => set({ error: msg }),
  setNotification: (msg: string | null) => set({ notification: msg }),
  toggleMute: () => {
    const newMute = sounds.toggleMute();
    set({ soundMuted: newMute });
  },
  setShowRulesModal: (show: boolean) => set({ showRulesModal: show }),

  initSocketListeners: () => {
    // Only register once
    if ((socket as any)._cutpattiListenersRegistered) return;
    (socket as any)._cutpattiListenersRegistered = true;

    const checkReconnect = () => {
      const { roomCode, sessionToken } = get();
      if (roomCode && sessionToken) {
        set({ isReconnecting: true });
        socket.emit(CutpattiClientEvent.Reconnect, { roomCode, sessionToken });
      }
    };

    socket.on('connect', () => {
      set({ isConnected: true, isReconnecting: false });
      checkReconnect();
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // Check immediately if socket is already connected when listeners are initialized
    if (socket.connected) {
      set({ isConnected: true });
      checkReconnect();
    }

    socket.on(CutpattiServerEvent.RoomCreated, (data: CutpattiRoomCreatedPayload) => {
      localStorage.setItem(STORAGE_KEY_ROOM, data.roomCode);
      localStorage.setItem(STORAGE_KEY_SESSION, data.sessionToken);
      set((state) => ({
        roomCode: data.roomCode,
        sessionToken: data.sessionToken,
        myPlayerId: data.playerId,
        room: data.room || state.room,
        notification: null,
        error: null,
        isReconnecting: false,
      }));
    });

    socket.on(CutpattiServerEvent.RoomJoined, (data: CutpattiRoomJoinedPayload) => {
      localStorage.setItem(STORAGE_KEY_ROOM, data.roomCode);
      localStorage.setItem(STORAGE_KEY_SESSION, data.sessionToken);
      set((state) => ({
        roomCode: data.roomCode,
        sessionToken: data.sessionToken,
        myPlayerId: data.playerId,
        room: data.room || state.room,
        notification: null,
        error: null,
        isReconnecting: false,
      }));
    });

    socket.on(CutpattiServerEvent.RoomUpdated, (room: CutpattiClientRoom) => {
      set({ room, isReconnecting: false });
    });

    socket.on(CutpattiServerEvent.RoomError, (data: CutpattiRoomErrorPayload) => {
      if (
        data.message.toLowerCase().includes('not exist') ||
        data.message.toLowerCase().includes('not found') ||
        data.message.toLowerCase().includes('invalid session')
      ) {
        localStorage.removeItem(STORAGE_KEY_ROOM);
        localStorage.removeItem(STORAGE_KEY_SESSION);
        set({ roomCode: null, sessionToken: null, room: null, gameState: null });
      }
      set({ error: data.message, notification: null, isReconnecting: false });
    });

    socket.on(CutpattiServerEvent.GameError, (data: CutpattiGameErrorPayload) => {
      set({ error: data.message, notification: null });
    });

    socket.on(CutpattiServerEvent.GameStarted, (gameState: CutpattiClientGameState) => {
      sounds.playCardDeal();
      set({ gameState, notification: 'Game started! Declare your bid.' });
    });

    socket.on(CutpattiServerEvent.GameStateUpdate, (gameState: CutpattiClientGameState) => {
      set({ gameState, error: null });
    });

    socket.on(CutpattiServerEvent.CardPlayed, (_playedCard: CutpattiPlayedCard) => {
      sounds.playCardPlay();
    });

    socket.on(CutpattiServerEvent.TrickComplete, (trick: CutpattiCompletedTrick) => {
      sounds.playHandWin();
      set({
        lastTrickResult: trick,
        trickNotice: `${trick.winnerName} won trick #${trick.trickNumber} with ${trick.winningCard.rank} of ${trick.winningCard.suit}!`,
      });
      setTimeout(() => {
        set({ trickNotice: null });
      }, 4000);
    });

    socket.on(CutpattiServerEvent.RoundComplete, (roundResult: CutpattiRoundResult) => {
      sounds.playTrumpDeclared();
      set({ roundResult });
    });
  },
}));

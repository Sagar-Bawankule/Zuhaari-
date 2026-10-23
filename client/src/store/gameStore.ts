import { create } from 'zustand';
import { socket } from '../lib/socket';
import { sounds } from '../lib/sound';
import {
  ClientEvent,
  ServerEvent,
  RoomCreatedPayload,
  RoomJoinedPayload,
  RoomErrorPayload,
  GameErrorPayload,
} from '@shared/types/events';
import {
  ClientRoom,
  ClientGameState,
  CompletedHand,
  RoundResult,
  CuttDecision,
  PublicPlayer,
} from '@shared/types/index';
import {
  Card,
  SeatIndex,
  Suit,
  TeamId,
  SEAT_TEAM,
} from '@shared/constants';

export interface HandWinnerNotice {
  winnerName: string;
  winningCardStr: string;
  team: string;
}

interface GameStore {
  // Connection & Auth
  playerName: string;
  roomCode: string | null;
  sessionToken: string | null;
  mySeatIndex: SeatIndex | null;
  isConnected: boolean;
  isReconnecting: boolean;

  // Room & Game
  room: ClientRoom | null;
  gameState: ClientGameState | null;
  lastHandResult: CompletedHand | null;
  roundResult: RoundResult | null;
  handWinnerNotice: HandWinnerNotice | null;

  // UI state
  error: string | null;
  notification: string | null;
  soundMuted: boolean;
  showRulesModal: boolean;

  // Computed helper getters
  getMyPlayer: () => PublicPlayer | null;
  getMyTeam: () => TeamId | null;
  isMyTurn: () => boolean;
  isMyCuttTurn: () => boolean;
  isHost: () => boolean;

  // Actions
  setPlayerName: (name: string) => void;
  createRoom: (playerName: string) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  selectSeat: (seatIndex: SeatIndex) => void;
  toggleReady: () => void;
  startGame: () => void;
  submitCuttBid: (action: 'declare' | 'pass', suit?: Suit) => void;
  playCard: (cardId: string) => void;
  playAgain: () => void;
  leaveRoom: () => void;
  attemptReconnect: () => void;
  setError: (msg: string | null) => void;
  setNotification: (msg: string | null) => void;
  toggleMute: () => void;
  setShowRulesModal: (show: boolean) => void;
  initSocketListeners: () => void;
}

const STORAGE_KEY_SESSION = 'zuhaari_session';
const STORAGE_KEY_ROOM = 'zuhaari_room';
const STORAGE_KEY_NAME = 'zuhaari_name';

export const useGameStore = create<GameStore>((set, get) => ({
  playerName: localStorage.getItem(STORAGE_KEY_NAME) || '',
  roomCode: localStorage.getItem(STORAGE_KEY_ROOM) || null,
  sessionToken: localStorage.getItem(STORAGE_KEY_SESSION) || null,
  mySeatIndex: null,
  isConnected: socket.connected,
  isReconnecting: false,

  room: null,
  gameState: null,
  lastHandResult: null,
  roundResult: null,
  handWinnerNotice: null,

  error: null,
  notification: null,
  soundMuted: sounds.getIsMuted(),
  showRulesModal: false,

  getMyPlayer: () => {
    const { room, mySeatIndex } = get();
    if (!room || mySeatIndex === null) return null;
    return room.players.find((p) => p.seatIndex === mySeatIndex) || null;
  },

  getMyTeam: () => {
    const { mySeatIndex } = get();
    if (mySeatIndex === null) return null;
    return SEAT_TEAM[mySeatIndex];
  },

  isMyTurn: () => {
    const { gameState, mySeatIndex } = get();
    if (!gameState || mySeatIndex === null) return false;
    return gameState.currentTurnSeat === mySeatIndex;
  },

  isMyCuttTurn: () => {
    const { gameState, mySeatIndex } = get();
    if (!gameState || mySeatIndex === null) return false;
    return gameState.cuttBiddingSeat === mySeatIndex;
  },

  isHost: () => {
    const { room, mySeatIndex } = get();
    if (!room || room.players.length === 0 || mySeatIndex === null) return false;
    // Player with seat 0 or first player in room
    return room.players[0].seatIndex === mySeatIndex;
  },

  setPlayerName: (name: string) => {
    set({ playerName: name });
    localStorage.setItem(STORAGE_KEY_NAME, name);
  },

  createRoom: (name: string) => {
    sounds.playClick();
    get().setPlayerName(name);
    set({ error: null, notification: 'Creating room...' });
    socket.emit(ClientEvent.CreateRoom, { playerName: name });
  },

  joinRoom: (code: string, name: string) => {
    sounds.playClick();
    get().setPlayerName(name);
    set({ error: null, notification: 'Joining room...' });
    socket.emit(ClientEvent.JoinRoom, {
      roomCode: code.toUpperCase().trim(),
      playerName: name,
    });
  },

  selectSeat: (seatIndex: SeatIndex) => {
    sounds.playClick();
    set({ error: null });
    socket.emit(ClientEvent.SelectSeat, { seatIndex });
  },

  toggleReady: () => {
    sounds.playClick();
    set({ error: null });
    socket.emit(ClientEvent.ToggleReady);
  },

  startGame: () => {
    sounds.playClick();
    set({ error: null });
    socket.emit(ClientEvent.StartGame);
  },

  submitCuttBid: (action: 'declare' | 'pass', suit?: Suit) => {
    sounds.playClick();
    set({ error: null });
    socket.emit(ClientEvent.CuttBid, { action, suit });
  },

  playCard: (cardId: string) => {
    sounds.playCardPlay();
    set({ error: null });
    socket.emit(ClientEvent.PlayCard, { cardId });
  },

  playAgain: () => {
    sounds.playClick();
    set({ roundResult: null, lastHandResult: null });
    socket.emit(ClientEvent.PlayAgain);
  },

  leaveRoom: () => {
    sounds.playClick();
    socket.emit(ClientEvent.LeaveRoom);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_ROOM);
    set({
      roomCode: null,
      sessionToken: null,
      mySeatIndex: null,
      room: null,
      gameState: null,
      lastHandResult: null,
      roundResult: null,
      handWinnerNotice: null,
      error: null,
    });
  },

  attemptReconnect: () => {
    const { roomCode, sessionToken } = get();
    if (!roomCode || !sessionToken) return;

    set({ isReconnecting: true, notification: 'Reconnecting to game...' });
    socket.emit(ClientEvent.Reconnect, { roomCode, sessionToken });
  },

  setError: (msg: string | null) => set({ error: msg }),
  setNotification: (msg: string | null) => set({ notification: msg }),

  toggleMute: () => {
    const muted = sounds.toggleMute();
    set({ soundMuted: muted });
  },

  setShowRulesModal: (show: boolean) => set({ showRulesModal: show }),

  initSocketListeners: () => {
    socket.on('connect', () => {
      set({ isConnected: true });
      // If we have saved session info, attempt reconnect
      const { roomCode, sessionToken } = get();
      if (roomCode && sessionToken) {
        get().attemptReconnect();
      }
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on(ServerEvent.RoomCreated, (data: RoomCreatedPayload) => {
      set({
        roomCode: data.roomCode,
        sessionToken: data.sessionToken,
        mySeatIndex: data.seatIndex as SeatIndex,
        notification: null,
        error: null,
      });
      localStorage.setItem(STORAGE_KEY_ROOM, data.roomCode);
      localStorage.setItem(STORAGE_KEY_SESSION, data.sessionToken);
    });

    socket.on(ServerEvent.RoomJoined, (data: RoomJoinedPayload) => {
      set({
        roomCode: data.roomCode,
        sessionToken: data.sessionToken,
        mySeatIndex: data.seatIndex as SeatIndex,
        notification: null,
        error: null,
      });
      localStorage.setItem(STORAGE_KEY_ROOM, data.roomCode);
      localStorage.setItem(STORAGE_KEY_SESSION, data.sessionToken);
    });

    socket.on(ServerEvent.RoomUpdated, (room: ClientRoom) => {
      const mySeat = get().mySeatIndex;
      // If player doesn't have seat yet, find by name
      const me = room.players.find((p) => p.name === get().playerName);
      set({
        room,
        mySeatIndex: me ? me.seatIndex : mySeat,
      });
    });

    socket.on(ServerEvent.RoomError, (data: RoomErrorPayload) => {
      set({ error: data.message, notification: null, isReconnecting: false });
    });

    socket.on(ServerEvent.GameError, (data: GameErrorPayload) => {
      set({ error: data.message });
    });

    socket.on(ServerEvent.PlayerReconnected, (data: any) => {
      set({
        isReconnecting: false,
        notification: `Reconnected to room ${data.roomCode}`,
        mySeatIndex: data.seatIndex as SeatIndex,
      });
      setTimeout(() => set({ notification: null }), 3000);
    });

    socket.on(ServerEvent.GameStarted, () => {
      sounds.playCardDeal();
      set({
        roundResult: null,
        lastHandResult: null,
        handWinnerNotice: null,
        notification: 'Game started! Cards dealt.',
      });
      setTimeout(() => set({ notification: null }), 2500);
    });

    socket.on(ServerEvent.FirstDeal, (data: { hand: Card[]; gameState: ClientGameState }) => {
      sounds.playCardDeal();
      set({ gameState: data.gameState });
    });

    socket.on(ServerEvent.SecondDeal, (data: { hand: Card[]; gameState: ClientGameState }) => {
      sounds.playCardDeal();
      set({ gameState: data.gameState });
    });

    socket.on(ServerEvent.CuttTurn, (data: { biddingSeat: SeatIndex; isDefaultCutt: boolean }) => {
      const mySeat = get().mySeatIndex;
      if (data.biddingSeat === mySeat) {
        sounds.playYourTurn();
      }
    });

    socket.on(ServerEvent.CuttDeclared, (data: { decision: CuttDecision }) => {
      sounds.playTrumpDeclared();
      const suitLabel = data.decision.suit.toUpperCase();
      set({
        notification: `Trump declared: ${suitLabel} (${data.decision.type === 'declared' ? 'Target: 6' : 'Target: 5'})`,
      });
      setTimeout(() => set({ notification: null }), 4000);
    });

    socket.on(ServerEvent.GameStateUpdate, (state: ClientGameState) => {
      const prevTurn = get().gameState?.currentTurnSeat;
      const mySeat = get().mySeatIndex;
      set({ gameState: state });

      if (state.currentTurnSeat === mySeat && prevTurn !== mySeat) {
        sounds.playYourTurn();
      }
    });

    socket.on(ServerEvent.CardPlayed, (_data: any) => {
      sounds.playCardPlay();
    });

    socket.on(ServerEvent.HandComplete, (data: { handResult: CompletedHand; teamHandsWon: Record<TeamId, number> }) => {
      sounds.playHandWin();
      const room = get().room;
      const winnerPlayer = room?.players.find((p) => p.id === data.handResult.winnerId);
      const winnerName = winnerPlayer?.name || `Seat ${data.handResult.winnerSeat}`;
      const winningCard = data.handResult.cards.find((c) => c.playerId === data.handResult.winnerId)?.card;
      const cardStr = winningCard ? `${winningCard.rank}${winningCard.suit}` : '';

      set({
        lastHandResult: data.handResult,
        handWinnerNotice: {
          winnerName,
          winningCardStr: cardStr,
          team: data.handResult.winningTeam === TeamId.TeamAC ? 'Team AC' : 'Team BD',
        },
      });

      setTimeout(() => {
        set({ handWinnerNotice: null });
      }, 3500);
    });

    socket.on(ServerEvent.RoundComplete, (data: { result: RoundResult }) => {
      sounds.playHandWin();
      set({ roundResult: data.result });
    });
  },
}));

/**
 * RoomManager — in-memory room management with clear interfaces for future persistence.
 */
import crypto from 'crypto';
import {
  MAX_PLAYERS_PER_ROOM,
  ROOM_CODE_LENGTH,
  SEAT_TEAM,
  SESSION_TOKEN_LENGTH,
  type SeatIndex,
} from '@shared/constants';
import {
  RoomStatus,
  type ClientRoom,
  type Player,
  type PublicPlayer,
  type Room,
} from '@shared/types/index';
import { GameEngine } from '../game/gameEngine';

/**
 * NOTE: In-memory rooms do NOT persist across server restarts.
 * This interface is designed so a database adapter can replace it later.
 */
export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private gameEngines: Map<string, GameEngine> = new Map();
  private sessionToRoom: Map<string, string> = new Map(); // sessionToken -> roomCode
  private socketToSession: Map<string, string> = new Map(); // socketId -> sessionToken

  // ─── Room Lifecycle ──────────────────────────────────────

  createRoom(playerName: string, socketId: string): {
    room: Room;
    player: Player;
    sessionToken: string;
  } {
    const code = this.generateRoomCode();
    const sessionToken = this.generateSessionToken();
    const seatIndex = 0 as SeatIndex;

    const player: Player = {
      id: socketId,
      name: playerName,
      seatIndex,
      team: SEAT_TEAM[seatIndex],
      isReady: false,
      isConnected: true,
      sessionToken,
    };

    const room: Room = {
      code,
      status: RoomStatus.Lobby,
      players: [player],
      gameState: null,
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.sessionToRoom.set(sessionToken, code);
    this.socketToSession.set(socketId, sessionToken);

    return { room, player, sessionToken };
  }

  joinRoom(roomCode: string, playerName: string, socketId: string): {
    room: Room;
    player: Player;
    sessionToken: string;
  } {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.status !== RoomStatus.Lobby) throw new Error('Game already in progress');
    if (room.players.length >= MAX_PLAYERS_PER_ROOM) throw new Error('Room is full');

    // Check duplicate name
    if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      throw new Error('Name already taken in this room');
    }

    const seatIndex = this.getNextAvailableSeat(room);
    const sessionToken = this.generateSessionToken();

    const player: Player = {
      id: socketId,
      name: playerName,
      seatIndex,
      team: SEAT_TEAM[seatIndex],
      isReady: false,
      isConnected: true,
      sessionToken,
    };

    room.players.push(player);
    this.sessionToRoom.set(sessionToken, roomCode);
    this.socketToSession.set(socketId, sessionToken);

    return { room, player, sessionToken };
  }

  // ─── Seat Selection ──────────────────────────────────────

  selectSeat(roomCode: string, socketId: string, newSeat: SeatIndex): Room {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.status !== RoomStatus.Lobby) throw new Error('Cannot change seat during game');

    const player = room.players.find(p => p.id === socketId);
    if (!player) throw new Error('Player not in room');

    // Check if seat is taken
    if (room.players.some(p => p.seatIndex === newSeat && p.id !== socketId)) {
      throw new Error('Seat is already taken');
    }

    player.seatIndex = newSeat;
    player.team = SEAT_TEAM[newSeat];

    return room;
  }

  // ─── Ready/Unready ──────────────────────────────────────

  toggleReady(roomCode: string, socketId: string): Room {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.id === socketId);
    if (!player) throw new Error('Player not in room');

    player.isReady = !player.isReady;
    return room;
  }

  // ─── Start Game ──────────────────────────────────────────

  canStartGame(roomCode: string): { canStart: boolean; reason?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { canStart: false, reason: 'Room not found' };
    if (room.status !== RoomStatus.Lobby) return { canStart: false, reason: 'Game already in progress' };
    if (room.players.length !== MAX_PLAYERS_PER_ROOM) {
      return { canStart: false, reason: `Need ${MAX_PLAYERS_PER_ROOM} players, have ${room.players.length}` };
    }
    if (!room.players.every(p => p.isReady)) {
      return { canStart: false, reason: 'All players must be ready' };
    }
    return { canStart: true };
  }

  startGame(roomCode: string): GameEngine {
    const { canStart, reason } = this.canStartGame(roomCode);
    if (!canStart) throw new Error(reason);

    const room = this.rooms.get(roomCode)!;
    room.status = RoomStatus.InGame;

    // Sort players by seat index for the engine
    const sortedPlayers = [...room.players].sort((a, b) => a.seatIndex - b.seatIndex);
    const engine = new GameEngine(sortedPlayers);

    this.gameEngines.set(roomCode, engine);
    return engine;
  }

  // ─── Reconnection ────────────────────────────────────────

  reconnect(sessionToken: string, newSocketId: string): {
    room: Room;
    player: Player;
  } | null {
    const roomCode = this.sessionToRoom.get(sessionToken);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.sessionToken === sessionToken);
    if (!player) return null;

    // Update socket ID
    const oldSocketId = player.id;
    this.socketToSession.delete(oldSocketId);

    player.id = newSocketId;
    player.isConnected = true;
    this.socketToSession.set(newSocketId, sessionToken);

    // Also update player ID in game engine's internal state if game is running
    const engine = this.gameEngines.get(roomCode);
    if (engine) {
      // The engine references the same player objects, so the ID update propagates
    }

    return { room, player };
  }

  // ─── Disconnect / Leave ──────────────────────────────────

  handleDisconnect(socketId: string): {
    roomCode: string;
    player: Player;
    roomDeleted: boolean;
  } | null {
    const sessionToken = this.socketToSession.get(socketId);
    if (!sessionToken) return null;

    const roomCode = this.sessionToRoom.get(sessionToken);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return null;

    if (room.status === RoomStatus.Lobby) {
      // In lobby, remove the player entirely
      room.players = room.players.filter(p => p.id !== socketId);
      this.sessionToRoom.delete(sessionToken);
      this.socketToSession.delete(socketId);

      // Delete room if empty
      if (room.players.length === 0) {
        this.rooms.delete(roomCode);
        return { roomCode, player, roomDeleted: true };
      }

      return { roomCode, player, roomDeleted: false };
    } else {
      // In game, mark as disconnected (allow reconnection)
      player.isConnected = false;
      this.socketToSession.delete(socketId);
      return { roomCode, player, roomDeleted: false };
    }
  }

  leaveRoom(roomCode: string, socketId: string): {
    player: Player;
    roomDeleted: boolean;
  } {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.id === socketId);
    if (!player) throw new Error('Player not in room');

    const sessionToken = player.sessionToken;

    room.players = room.players.filter(p => p.id !== socketId);
    this.sessionToRoom.delete(sessionToken);
    this.socketToSession.delete(socketId);

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      this.gameEngines.delete(roomCode);
      return { player, roomDeleted: true };
    }

    return { player, roomDeleted: false };
  }

  resetRoom(roomCode: string): Room {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    room.status = RoomStatus.Lobby;
    room.gameState = null;
    room.players.forEach(p => { p.isReady = false; });
    this.gameEngines.delete(roomCode);

    return room;
  }

  // ─── Getters ─────────────────────────────────────────────

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  getEngine(roomCode: string): GameEngine | undefined {
    return this.gameEngines.get(roomCode);
  }

  getRoomBySocketId(socketId: string): { room: Room; player: Player } | null {
    const sessionToken = this.socketToSession.get(socketId);
    if (!sessionToken) return null;

    const roomCode = this.sessionToRoom.get(sessionToken);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return null;

    return { room, player };
  }

  getClientRoom(roomCode: string): ClientRoom | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    return {
      code: room.code,
      status: room.status,
      players: room.players.map(p => this.toPublicPlayer(p)),
    };
  }

  private toPublicPlayer(player: Player): PublicPlayer {
    return {
      id: player.id,
      name: player.name,
      seatIndex: player.seatIndex,
      team: player.team,
      isReady: player.isReady,
      isConnected: player.isConnected,
      cardCount: 0, // Updated by game engine when in-game
    };
  }

  // ─── Utilities ───────────────────────────────────────────

  private generateRoomCode(): string {
    let code: string;
    do {
      code = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, ROOM_CODE_LENGTH);
    } while (this.rooms.has(code));
    return code;
  }

  private generateSessionToken(): string {
    return crypto.randomBytes(SESSION_TOKEN_LENGTH).toString('hex');
  }

  private getNextAvailableSeat(room: Room): SeatIndex {
    const taken = new Set(room.players.map(p => p.seatIndex));
    for (let i = 0; i < MAX_PLAYERS_PER_ROOM; i++) {
      if (!taken.has(i as SeatIndex)) return i as SeatIndex;
    }
    throw new Error('No available seats');
  }
}

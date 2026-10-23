import crypto from 'crypto';
import {
  CUTPATTI_MIN_PLAYERS,
  CUTPATTI_MAX_PLAYERS,
  CUTPATTI_ROOM_CODE_LENGTH,
  CUTPATTI_SESSION_TOKEN_LENGTH,
} from '@shared/cutpatti/constants';
import {
  CutpattiClientRoom,
  CutpattiPlayer,
  CutpattiPublicPlayer,
  CutpattiRoom,
} from '@shared/cutpatti/types';
import { RoomStatus } from '@shared/types/index';
import { CutpattiGameEngine } from './gameEngine';

export class CutpattiRoomManager {
  private rooms: Map<string, CutpattiRoom> = new Map();
  private engines: Map<string, CutpattiGameEngine> = new Map();
  private sessionToRoom: Map<string, string> = new Map(); // sessionToken -> roomCode
  private socketToSession: Map<string, string> = new Map(); // socketId -> sessionToken

  // ─── Room Lifecycle ──────────────────────────────────────

  public createRoom(
    playerName: string,
    socketId: string
  ): {
    room: CutpattiClientRoom;
    player: CutpattiPlayer;
    sessionToken: string;
  } {
    const code = this.generateRoomCode();
    const sessionToken = this.generateSessionToken();

    const player: CutpattiPlayer = {
      id: socketId,
      name: playerName.trim(),
      seatIndex: 0,
      isReady: true, // host is ready by default
      isConnected: true,
      sessionToken,
      isHost: true,
    };

    const room: CutpattiRoom = {
      code,
      status: RoomStatus.Lobby,
      players: [player],
      hostId: socketId,
      gameState: null,
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.sessionToRoom.set(sessionToken, code);
    this.socketToSession.set(socketId, sessionToken);

    return {
      room: this.toClientRoom(room),
      player,
      sessionToken,
    };
  }

  public joinRoom(
    roomCode: string,
    playerName: string,
    socketId: string
  ): {
    room: CutpattiClientRoom;
    player: CutpattiPlayer;
    sessionToken: string;
  } {
    const code = roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      throw new Error(`Cutpatti room "${code}" does not exist`);
    }

    if (room.status !== RoomStatus.Lobby) {
      throw new Error('Game already in progress in this room');
    }

    if (room.players.length >= CUTPATTI_MAX_PLAYERS) {
      throw new Error(`Room is full (max ${CUTPATTI_MAX_PLAYERS} players)`);
    }

    // Name uniqueness check
    const trimmedName = playerName.trim();
    if (
      room.players.some(
        (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.isConnected
      )
    ) {
      throw new Error(`A player named "${trimmedName}" is already in this room`);
    }

    const sessionToken = this.generateSessionToken();
    const seatIndex = room.players.length;

    const player: CutpattiPlayer = {
      id: socketId,
      name: trimmedName,
      seatIndex,
      isReady: false,
      isConnected: true,
      sessionToken,
      isHost: false,
    };

    room.players.push(player);
    this.sessionToRoom.set(sessionToken, code);
    this.socketToSession.set(socketId, sessionToken);

    return {
      room: this.toClientRoom(room),
      player,
      sessionToken,
    };
  }

  public leaveRoom(socketId: string): {
    roomCode: string;
    room: CutpattiClientRoom | null;
    wasHost: boolean;
  } | null {
    const sessionToken = this.socketToSession.get(socketId);
    if (!sessionToken) return null;

    const roomCode = this.sessionToRoom.get(sessionToken);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const playerIndex = room.players.findIndex((p) => p.id === socketId);
    if (playerIndex === -1) return null;

    const leavingPlayer = room.players[playerIndex];
    const wasHost = leavingPlayer.isHost;

    // Clean mappings
    this.socketToSession.delete(socketId);
    this.sessionToRoom.delete(sessionToken);

    if (room.status === RoomStatus.Lobby) {
      // Remove from room
      room.players.splice(playerIndex, 1);

      if (room.players.length === 0) {
        // Room empty, delete
        this.rooms.delete(roomCode);
        this.engines.delete(roomCode);
        return { roomCode, room: null, wasHost };
      }

      // Reassign seat indices
      room.players.forEach((p, idx) => {
        p.seatIndex = idx;
      });

      // Pass host to next player if host left
      if (wasHost && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }

      return { roomCode, room: this.toClientRoom(room), wasHost };
    }

    // If game in progress, mark disconnected
    leavingPlayer.isConnected = false;
    return { roomCode, room: this.toClientRoom(room), wasHost };
  }

  public toggleReady(socketId: string): { roomCode: string; room: CutpattiClientRoom } {
    const { room, player } = this.findPlayerBySocket(socketId);

    if (room.status !== RoomStatus.Lobby) {
      throw new Error('Cannot change ready state during a game');
    }

    player.isReady = !player.isReady;
    return { roomCode: room.code, room: this.toClientRoom(room) };
  }

  public startGame(socketId: string): {
    roomCode: string;
    room: CutpattiClientRoom;
    engine: CutpattiGameEngine;
  } {
    const { room, player } = this.findPlayerBySocket(socketId);

    if (!player.isHost) {
      throw new Error('Only the room host can start the game');
    }

    if (room.players.length < CUTPATTI_MIN_PLAYERS) {
      throw new Error(
        `Cutpatti requires at least ${CUTPATTI_MIN_PLAYERS} players to start (currently ${room.players.length})`
      );
    }

    if (room.players.length > CUTPATTI_MAX_PLAYERS) {
      throw new Error(`Cutpatti supports at most ${CUTPATTI_MAX_PLAYERS} players`);
    }

    const unreadyPlayers = room.players.filter((p) => !p.isReady);
    if (unreadyPlayers.length > 0) {
      const names = unreadyPlayers.map((p) => p.name).join(', ');
      throw new Error(`Cannot start: the following players are not ready: ${names}`);
    }

    room.status = RoomStatus.InGame;

    const engine = new CutpattiGameEngine(room.players);
    this.engines.set(room.code, engine);
    room.gameState = engine.state;

    return {
      roomCode: room.code,
      room: this.toClientRoom(room),
      engine,
    };
  }

  public handleDisconnect(socketId: string): {
    roomCode: string;
    room: CutpattiClientRoom;
    player: CutpattiPlayer;
  } | null {
    const sessionToken = this.socketToSession.get(socketId);
    if (!sessionToken) return null;

    const roomCode = this.sessionToRoom.get(sessionToken);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find((p) => p.id === socketId);
    if (!player) return null;

    player.isConnected = false;
    this.socketToSession.delete(socketId);

    return { roomCode, room: this.toClientRoom(room), player };
  }

  public reconnect(
    roomCode: string,
    sessionToken: string,
    newSocketId: string
  ): {
    room: CutpattiClientRoom;
    player: CutpattiPlayer;
    engine: CutpattiGameEngine | null;
  } {
    const code = roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player) {
      throw new Error('Invalid session token');
    }

    player.id = newSocketId;
    player.isConnected = true;
    if (player.isHost) {
      room.hostId = newSocketId;
    }

    this.socketToSession.set(newSocketId, sessionToken);

    const engine = this.engines.get(code) || null;

    return {
      room: this.toClientRoom(room),
      player,
      engine,
    };
  }

  public getRoom(roomCode: string): CutpattiRoom | null {
    return this.rooms.get(roomCode.trim().toUpperCase()) || null;
  }

  public getClientRoom(roomCode: string): CutpattiClientRoom | null {
    const room = this.getRoom(roomCode);
    return room ? this.toClientRoom(room) : null;
  }

  public getEngine(roomCode: string): CutpattiGameEngine | null {
    return this.engines.get(roomCode.trim().toUpperCase()) || null;
  }

  public findPlayerBySocket(socketId: string): {
    room: CutpattiRoom;
    player: CutpattiPlayer;
  } {
    const sessionToken = this.socketToSession.get(socketId);
    if (!sessionToken) {
      throw new Error('Not connected to any session');
    }

    const roomCode = this.sessionToRoom.get(sessionToken);
    if (!roomCode) {
      throw new Error('Session not associated with a room');
    }

    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player) {
      throw new Error('Player not in room');
    }

    return { room, player };
  }

  public toClientRoom(room: CutpattiRoom): CutpattiClientRoom {
    const engine = this.engines.get(room.code);
    const publicPlayers: CutpattiPublicPlayer[] = engine
      ? engine.getPublicPlayers()
      : room.players.map((p) => ({
          id: p.id,
          name: p.name,
          seatIndex: p.seatIndex,
          isReady: p.isReady,
          isConnected: p.isConnected,
          isHost: p.isHost,
          cardCount: 0,
          bid: null,
          tricksWon: 0,
          roundScore: null,
          totalScore: 0,
        }));

    return {
      code: room.code,
      status: room.status,
      hostId: room.hostId,
      players: publicPlayers,
    };
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    do {
      code = 'CP'; // prefix for Cutpatti
      for (let i = 0; i < CUTPATTI_ROOM_CODE_LENGTH - 2; i++) {
        code += chars.charAt(crypto.randomInt(0, chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  private generateSessionToken(): string {
    return crypto.randomBytes(CUTPATTI_SESSION_TOKEN_LENGTH / 2).toString('hex');
  }
}

export const cutpattiRoomManager = new CutpattiRoomManager();

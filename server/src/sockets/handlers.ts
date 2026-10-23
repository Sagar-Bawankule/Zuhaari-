/**
 * Socket.IO event handlers — all game actions are validated and processed here.
 */
import type { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/roomManager';
import {
  ClientEvent,
  ServerEvent,
} from '@shared/types/events';
import {
  createRoomSchema,
  joinRoomSchema,
  selectSeatSchema,
  reconnectSchema,
  cuttBidSchema,
  playCardSchema,
} from './validation';
import type { SeatIndex, Suit } from '@shared/constants';
import { RoomStatus } from '@shared/types/index';

const roomManager = new RoomManager();

/** Rate limiting map: socketId -> { action -> lastTimestamp } */
const rateLimits = new Map<string, Map<string, number>>();
const RATE_LIMIT_MS = 200; // 200ms minimum between same actions

function isRateLimited(socketId: string, action: string): boolean {
  if (!rateLimits.has(socketId)) {
    rateLimits.set(socketId, new Map());
  }
  const limits = rateLimits.get(socketId)!;
  const lastTime = limits.get(action) || 0;
  const now = Date.now();
  if (now - lastTime < RATE_LIMIT_MS) return true;
  limits.set(action, now);
  return false;
}

function emitRoomUpdate(io: Server, roomCode: string) {
  const clientRoom = roomManager.getClientRoom(roomCode);
  if (clientRoom) {
    io.to(roomCode).emit(ServerEvent.RoomUpdated, clientRoom);
  }
}

function emitGameStateToAll(io: Server, roomCode: string) {
  const room = roomManager.getRoom(roomCode);
  const engine = roomManager.getEngine(roomCode);
  if (!room || !engine) return;

  for (const player of room.players) {
    const clientState = engine.getClientState(player.id);
    io.to(player.id).emit(ServerEvent.GameStateUpdate, clientState);
  }
}

export function registerHandlers(io: Server, socket: Socket) {
  // ─── Create Room ───────────────────────────────────────
  socket.on(ClientEvent.CreateRoom, (data: unknown) => {
    try {
      if (isRateLimited(socket.id, 'create')) {
        socket.emit(ServerEvent.RoomError, { message: 'Too many requests' });
        return;
      }

      const parsed = createRoomSchema.parse(data);
      const { room, player, sessionToken } = roomManager.createRoom(parsed.playerName, socket.id);

      socket.join(room.code);
      socket.emit(ServerEvent.RoomCreated, {
        roomCode: room.code,
        sessionToken,
        seatIndex: player.seatIndex,
      });
      emitRoomUpdate(io, room.code);
    } catch (err: any) {
      socket.emit(ServerEvent.RoomError, { message: err.message || 'Failed to create room' });
    }
  });

  // ─── Join Room ─────────────────────────────────────────
  socket.on(ClientEvent.JoinRoom, (data: unknown) => {
    try {
      if (isRateLimited(socket.id, 'join')) {
        socket.emit(ServerEvent.RoomError, { message: 'Too many requests' });
        return;
      }

      const parsed = joinRoomSchema.parse(data);
      const { room, player, sessionToken } = roomManager.joinRoom(
        parsed.roomCode,
        parsed.playerName,
        socket.id,
      );

      socket.join(room.code);
      socket.emit(ServerEvent.RoomJoined, {
        roomCode: room.code,
        sessionToken,
        seatIndex: player.seatIndex,
      });

      socket.to(room.code).emit(ServerEvent.PlayerJoined, {
        name: player.name,
        seatIndex: player.seatIndex,
      });

      emitRoomUpdate(io, room.code);
    } catch (err: any) {
      socket.emit(ServerEvent.RoomError, { message: err.message || 'Failed to join room' });
    }
  });

  // ─── Select Seat ───────────────────────────────────────
  socket.on(ClientEvent.SelectSeat, (data: unknown) => {
    try {
      const parsed = selectSeatSchema.parse(data);
      const context = roomManager.getRoomBySocketId(socket.id);
      if (!context) throw new Error('Not in a room');

      roomManager.selectSeat(context.room.code, socket.id, parsed.seatIndex as SeatIndex);
      emitRoomUpdate(io, context.room.code);
    } catch (err: any) {
      socket.emit(ServerEvent.RoomError, { message: err.message || 'Failed to select seat' });
    }
  });

  // ─── Toggle Ready ──────────────────────────────────────
  socket.on(ClientEvent.ToggleReady, () => {
    try {
      const context = roomManager.getRoomBySocketId(socket.id);
      if (!context) throw new Error('Not in a room');

      roomManager.toggleReady(context.room.code, socket.id);
      emitRoomUpdate(io, context.room.code);
    } catch (err: any) {
      socket.emit(ServerEvent.RoomError, { message: err.message || 'Failed to toggle ready' });
    }
  });

  // ─── Start Game ────────────────────────────────────────
  socket.on(ClientEvent.StartGame, () => {
    try {
      const context = roomManager.getRoomBySocketId(socket.id);
      if (!context) throw new Error('Not in a room');

      const engine = roomManager.startGame(context.room.code);

      io.to(context.room.code).emit(ServerEvent.GameStarted, {});

      // Send each player their first 5 cards
      for (const player of context.room.players) {
        const clientState = engine.getClientState(player.id);
        io.to(player.id).emit(ServerEvent.FirstDeal, {
          hand: clientState.myHand,
          gameState: clientState,
        });
      }
    } catch (err: any) {
      socket.emit(ServerEvent.RoomError, { message: err.message || 'Failed to start game' });
    }
  });

  // ─── Cutt Bid ──────────────────────────────────────────
  socket.on(ClientEvent.CuttBid, (data: unknown) => {
    try {
      if (isRateLimited(socket.id, 'cutt')) {
        socket.emit(ServerEvent.GameError, { message: 'Too many requests' });
        return;
      }

      const parsed = cuttBidSchema.parse(data);
      const context = roomManager.getRoomBySocketId(socket.id);
      if (!context) throw new Error('Not in a room');

      const engine = roomManager.getEngine(context.room.code);
      if (!engine) throw new Error('Game not started');

      if (parsed.action === 'pass') {
        const { allPassed, nextSeat } = engine.processCuttPass(context.player.seatIndex as SeatIndex);

        if (allPassed) {
          // Notify that default cutt is required
          io.to(context.room.code).emit(ServerEvent.CuttTurn, {
            biddingSeat: nextSeat,
            isDefaultCutt: true,
          });
        } else {
          io.to(context.room.code).emit(ServerEvent.CuttTurn, {
            biddingSeat: nextSeat,
            isDefaultCutt: false,
          });
        }
      } else {
        // Declare
        const decision = engine.processCuttDeclare(
          context.player.seatIndex as SeatIndex,
          parsed.suit as Suit,
          context.player.id,
        );

        io.to(context.room.code).emit(ServerEvent.CuttDeclared, { decision });

        // Send second deal cards
        for (const player of context.room.players) {
          const clientState = engine.getClientState(player.id);
          io.to(player.id).emit(ServerEvent.SecondDeal, {
            hand: clientState.myHand,
            gameState: clientState,
          });
        }
      }

      emitGameStateToAll(io, context.room.code);
    } catch (err: any) {
      socket.emit(ServerEvent.GameError, { message: err.message || 'Invalid cutt action' });
    }
  });

  // ─── Play Card ─────────────────────────────────────────
  socket.on(ClientEvent.PlayCard, (data: unknown) => {
    try {
      if (isRateLimited(socket.id, 'play')) {
        socket.emit(ServerEvent.GameError, { message: 'Too many requests' });
        return;
      }

      const parsed = playCardSchema.parse(data);
      const context = roomManager.getRoomBySocketId(socket.id);
      if (!context) throw new Error('Not in a room');

      const engine = roomManager.getEngine(context.room.code);
      if (!engine) throw new Error('Game not started');

      const result = engine.playCard(context.player.id, parsed.cardId);

      // Broadcast the card played
      io.to(context.room.code).emit(ServerEvent.CardPlayed, {
        playedCard: result.playedCard,
        currentTurnSeat: engine.getCurrentTurnSeat(),
      });

      if (result.handComplete) {
        io.to(context.room.code).emit(ServerEvent.HandComplete, {
          handResult: result.handResult,
          teamHandsWon: engine.getTeamHandsWon(),
        });

        if (result.roundComplete) {
          io.to(context.room.code).emit(ServerEvent.RoundComplete, {
            result: result.roundResult,
          });
        }
      }

      // Send updated game state to each player
      emitGameStateToAll(io, context.room.code);
    } catch (err: any) {
      socket.emit(ServerEvent.GameError, { message: err.message || 'Invalid card play' });
    }
  });

  // ─── Play Again ────────────────────────────────────────
  socket.on(ClientEvent.PlayAgain, () => {
    try {
      const context = roomManager.getRoomBySocketId(socket.id);
      if (!context) throw new Error('Not in a room');

      roomManager.resetRoom(context.room.code);
      emitRoomUpdate(io, context.room.code);
    } catch (err: any) {
      socket.emit(ServerEvent.RoomError, { message: err.message || 'Failed to reset room' });
    }
  });

  // ─── Reconnect ─────────────────────────────────────────
  socket.on(ClientEvent.Reconnect, (data: unknown) => {
    try {
      const parsed = reconnectSchema.parse(data);
      const result = roomManager.reconnect(parsed.sessionToken, socket.id);
      if (!result) {
        socket.emit(ServerEvent.RoomError, { message: 'Session expired or invalid' });
        return;
      }

      socket.join(result.room.code);
      socket.emit(ServerEvent.PlayerReconnected, {
        roomCode: result.room.code,
        seatIndex: result.player.seatIndex,
        sessionToken: parsed.sessionToken,
      });

      socket.to(result.room.code).emit(ServerEvent.PlayerReconnected, {
        name: result.player.name,
        seatIndex: result.player.seatIndex,
      });

      emitRoomUpdate(io, result.room.code);

      // If game is in progress, send game state
      const engine = roomManager.getEngine(result.room.code);
      if (engine && result.room.status === RoomStatus.InGame) {
        const clientState = engine.getClientState(result.player.id);
        socket.emit(ServerEvent.GameStateUpdate, clientState);
      }
    } catch (err: any) {
      socket.emit(ServerEvent.RoomError, { message: err.message || 'Reconnection failed' });
    }
  });

  // ─── Leave Room ────────────────────────────────────────
  socket.on(ClientEvent.LeaveRoom, () => {
    try {
      const context = roomManager.getRoomBySocketId(socket.id);
      if (!context) return;

      const { player } = roomManager.leaveRoom(context.room.code, socket.id);
      socket.leave(context.room.code);

      socket.to(context.room.code).emit(ServerEvent.PlayerLeft, {
        name: player.name,
        seatIndex: player.seatIndex,
      });

      emitRoomUpdate(io, context.room.code);
    } catch (err: any) {
      socket.emit(ServerEvent.RoomError, { message: err.message || 'Failed to leave room' });
    }
  });

  // ─── Disconnect ────────────────────────────────────────
  socket.on('disconnect', () => {
    const result = roomManager.handleDisconnect(socket.id);
    if (!result) return;

    if (!result.roomDeleted) {
      socket.to(result.roomCode).emit(ServerEvent.PlayerDisconnected, {
        name: result.player.name,
        seatIndex: result.player.seatIndex,
      });
      emitRoomUpdate(io, result.roomCode);
    }

    // Clean up rate limits
    rateLimits.delete(socket.id);
  });
}

export { roomManager };

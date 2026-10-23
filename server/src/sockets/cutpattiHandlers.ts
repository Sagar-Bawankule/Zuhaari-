import type { Server, Socket } from 'socket.io';
import { cutpattiRoomManager } from '../cutpatti/roomManager';
import {
  CutpattiClientEvent,
  CutpattiServerEvent,
  CutpattiRoomErrorPayload,
  CutpattiGameErrorPayload,
} from '@shared/cutpatti/events';
import {
  createCutpattiRoomSchema,
  joinCutpattiRoomSchema,
  reconnectCutpattiSchema,
  submitCutpattiBidSchema,
  playCutpattiCardSchema,
} from './cutpattiValidation';

export function registerCutpattiHandlers(io: Server, socket: Socket) {
  function emitCutpattiRoomUpdate(roomCode: string) {
    const clientRoom = cutpattiRoomManager.getClientRoom(roomCode);
    if (clientRoom) {
      io.to(roomCode).emit(CutpattiServerEvent.RoomUpdated, clientRoom);
    }
  }

  function emitCutpattiGameStateToAll(roomCode: string) {
    const room = cutpattiRoomManager.getRoom(roomCode);
    const engine = cutpattiRoomManager.getEngine(roomCode);
    if (!room || !engine) return;

    for (const player of room.players) {
      const clientState = engine.getClientState(player.id);
      io.to(player.id).emit(CutpattiServerEvent.GameStateUpdate, clientState);
    }
  }

  // ─── Create Room ─────────────────────────────────────────
  socket.on(CutpattiClientEvent.CreateRoom, (data: unknown) => {
    try {
      const parsed = createCutpattiRoomSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit(CutpattiServerEvent.RoomError, {
          message: parsed.error.issues[0]?.message || 'Invalid player name',
        } as CutpattiRoomErrorPayload);
        return;
      }

      const { room, player, sessionToken } = cutpattiRoomManager.createRoom(
        parsed.data.playerName,
        socket.id
      );

      socket.join(room.code);

      socket.emit(CutpattiServerEvent.RoomCreated, {
        roomCode: room.code,
        sessionToken,
        playerId: player.id,
      });

      emitCutpattiRoomUpdate(room.code);
    } catch (err: any) {
      socket.emit(CutpattiServerEvent.RoomError, {
        message: err.message || 'Failed to create room',
      } as CutpattiRoomErrorPayload);
    }
  });

  // ─── Join Room ───────────────────────────────────────────
  socket.on(CutpattiClientEvent.JoinRoom, (data: unknown) => {
    try {
      const parsed = joinCutpattiRoomSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit(CutpattiServerEvent.RoomError, {
          message: parsed.error.issues[0]?.message || 'Invalid room code or name',
        } as CutpattiRoomErrorPayload);
        return;
      }

      const { room, player, sessionToken } = cutpattiRoomManager.joinRoom(
        parsed.data.roomCode,
        parsed.data.playerName,
        socket.id
      );

      socket.join(room.code);

      socket.emit(CutpattiServerEvent.RoomJoined, {
        roomCode: room.code,
        sessionToken,
        playerId: player.id,
      });

      emitCutpattiRoomUpdate(room.code);
    } catch (err: any) {
      socket.emit(CutpattiServerEvent.RoomError, {
        message: err.message || 'Failed to join room',
      } as CutpattiRoomErrorPayload);
    }
  });

  // ─── Leave Room ──────────────────────────────────────────
  socket.on(CutpattiClientEvent.LeaveRoom, () => {
    try {
      const result = cutpattiRoomManager.leaveRoom(socket.id);
      if (result) {
        socket.leave(result.roomCode);
        if (result.room) {
          emitCutpattiRoomUpdate(result.roomCode);
        }
      }
    } catch (err: any) {
      socket.emit(CutpattiServerEvent.RoomError, {
        message: err.message || 'Failed to leave room',
      } as CutpattiRoomErrorPayload);
    }
  });

  // ─── Toggle Ready ────────────────────────────────────────
  socket.on(CutpattiClientEvent.ToggleReady, () => {
    try {
      const { roomCode } = cutpattiRoomManager.toggleReady(socket.id);
      emitCutpattiRoomUpdate(roomCode);
    } catch (err: any) {
      socket.emit(CutpattiServerEvent.RoomError, {
        message: err.message || 'Failed to toggle ready',
      } as CutpattiRoomErrorPayload);
    }
  });

  // ─── Start Game ──────────────────────────────────────────
  socket.on(CutpattiClientEvent.StartGame, () => {
    try {
      const { roomCode, engine } = cutpattiRoomManager.startGame(socket.id);
      emitCutpattiRoomUpdate(roomCode);

      const room = cutpattiRoomManager.getRoom(roomCode);
      if (room) {
        for (const player of room.players) {
          const clientState = engine.getClientState(player.id);
          io.to(player.id).emit(CutpattiServerEvent.GameStarted, clientState);
          io.to(player.id).emit(CutpattiServerEvent.GameStateUpdate, clientState);
        }
      }
    } catch (err: any) {
      socket.emit(CutpattiServerEvent.GameError, {
        message: err.message || 'Failed to start game',
      } as CutpattiGameErrorPayload);
    }
  });

  // ─── Submit Bid ──────────────────────────────────────────
  socket.on(CutpattiClientEvent.SubmitBid, (data: unknown) => {
    try {
      const parsed = submitCutpattiBidSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit(CutpattiServerEvent.GameError, {
          message: parsed.error.issues[0]?.message || 'Invalid bid value',
        } as CutpattiGameErrorPayload);
        return;
      }

      const { room, player } = cutpattiRoomManager.findPlayerBySocket(socket.id);
      const engine = cutpattiRoomManager.getEngine(room.code);
      if (!engine) {
        socket.emit(CutpattiServerEvent.GameError, {
          message: 'No active game found',
        } as CutpattiGameErrorPayload);
        return;
      }

      const result = engine.submitBid(player.id, parsed.data.bid);
      if (!result.success) {
        socket.emit(CutpattiServerEvent.GameError, {
          message: result.error || 'Failed to submit bid',
        } as CutpattiGameErrorPayload);
        return;
      }

      // Notify clients of bidding progress
      emitCutpattiGameStateToAll(room.code);
    } catch (err: any) {
      socket.emit(CutpattiServerEvent.GameError, {
        message: err.message || 'Failed to submit bid',
      } as CutpattiGameErrorPayload);
    }
  });

  // ─── Play Card ───────────────────────────────────────────
  socket.on(CutpattiClientEvent.PlayCard, (data: unknown) => {
    try {
      const parsed = playCutpattiCardSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit(CutpattiServerEvent.GameError, {
          message: parsed.error.issues[0]?.message || 'Invalid card',
        } as CutpattiGameErrorPayload);
        return;
      }

      const { room, player } = cutpattiRoomManager.findPlayerBySocket(socket.id);
      const engine = cutpattiRoomManager.getEngine(room.code);
      if (!engine) {
        socket.emit(CutpattiServerEvent.GameError, {
          message: 'No active game found',
        } as CutpattiGameErrorPayload);
        return;
      }

      const result = engine.playCard(player.id, parsed.data.cardId);
      if (!result.success) {
        socket.emit(CutpattiServerEvent.GameError, {
          message: result.error || 'Illegal card play',
        } as CutpattiGameErrorPayload);
        return;
      }

      if (result.playedCard) {
        io.to(room.code).emit(CutpattiServerEvent.CardPlayed, result.playedCard);
      }

      if (result.completedTrick) {
        io.to(room.code).emit(CutpattiServerEvent.TrickComplete, result.completedTrick);
      }

      if (result.roundResult) {
        io.to(room.code).emit(CutpattiServerEvent.RoundComplete, result.roundResult);
      }

      emitCutpattiGameStateToAll(room.code);
      emitCutpattiRoomUpdate(room.code);
    } catch (err: any) {
      socket.emit(CutpattiServerEvent.GameError, {
        message: err.message || 'Failed to play card',
      } as CutpattiGameErrorPayload);
    }
  });

  // ─── Next Round ──────────────────────────────────────────
  socket.on(CutpattiClientEvent.NextRound, () => {
    try {
      const { room } = cutpattiRoomManager.findPlayerBySocket(socket.id);
      const engine = cutpattiRoomManager.getEngine(room.code);
      if (!engine) {
        socket.emit(CutpattiServerEvent.GameError, {
          message: 'No active game found',
        } as CutpattiGameErrorPayload);
        return;
      }

      engine.nextRound();
      emitCutpattiGameStateToAll(room.code);
      emitCutpattiRoomUpdate(room.code);
    } catch (err: any) {
      socket.emit(CutpattiServerEvent.GameError, {
        message: err.message || 'Failed to advance to next round',
      } as CutpattiGameErrorPayload);
    }
  });

  // ─── Reconnect ───────────────────────────────────────────
  socket.on(CutpattiClientEvent.Reconnect, (data: unknown) => {
    try {
      const parsed = reconnectCutpattiSchema.safeParse(data);
      if (!parsed.success) return;

      const { room, player, engine } = cutpattiRoomManager.reconnect(
        parsed.data.roomCode,
        parsed.data.sessionToken,
        socket.id
      );

      socket.join(room.code);

      socket.emit(CutpattiServerEvent.RoomJoined, {
        roomCode: room.code,
        sessionToken: player.sessionToken,
        playerId: player.id,
      });

      emitCutpattiRoomUpdate(room.code);

      if (engine) {
        const clientState = engine.getClientState(player.id);
        socket.emit(CutpattiServerEvent.GameStateUpdate, clientState);
      }
    } catch {
      // Reconnect fail silently or error
    }
  });

  // ─── Disconnect cleanup ──────────────────────────────────
  socket.on('disconnect', () => {
    try {
      const result = cutpattiRoomManager.handleDisconnect(socket.id);
      if (result) {
        emitCutpattiRoomUpdate(result.roomCode);
      }
    } catch {
      // ignore
    }
  });
}

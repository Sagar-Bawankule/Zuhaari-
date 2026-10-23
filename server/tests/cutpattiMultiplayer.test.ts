import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import express from 'express';
import { registerCutpattiHandlers } from '../src/sockets/cutpattiHandlers';
import {
  CutpattiClientEvent,
  CutpattiServerEvent,
  CutpattiRoomCreatedPayload,
  CutpattiRoomJoinedPayload,
} from '@shared/cutpatti/events';
import { CutpattiClientGameState, CutpattiClientRoom } from '@shared/cutpatti/types';

describe('Cutpatti Multiplayer Socket.IO Flow', () => {
  let io: Server;
  let server: any;
  let port: number;

  beforeAll(async () => {
    const app = express();
    server = createServer(app);
    io = new Server(server);

    io.on('connection', (socket) => {
      registerCutpattiHandlers(io, socket);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      io.close(() => {
        server.close(() => resolve());
      });
    });
  });

  const createClient = (): Promise<ClientSocket> => {
    return new Promise((resolve) => {
      const client = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      client.on('connect', () => resolve(client));
    });
  };

  it('runs a 3-player Cutpatti room creation, join, ready, start, bidding and playing trick via Socket.IO', async () => {
    const clientA = await createClient();
    const clientB = await createClient();
    const clientC = await createClient();

    // 1. Player A creates room
    const createPromise = new Promise<CutpattiRoomCreatedPayload>((resolve) => {
      clientA.once(CutpattiServerEvent.RoomCreated, resolve);
    });
    clientA.emit(CutpattiClientEvent.CreateRoom, { playerName: 'Alice' });
    const { roomCode } = await createPromise;
    expect(roomCode).toBeDefined();

    // 2. Player B & C join room
    const joinBPromise = new Promise<CutpattiRoomJoinedPayload>((resolve) => {
      clientB.once(CutpattiServerEvent.RoomJoined, resolve);
    });
    clientB.emit(CutpattiClientEvent.JoinRoom, { roomCode, playerName: 'Bob' });
    await joinBPromise;

    const joinCPromise = new Promise<CutpattiRoomJoinedPayload>((resolve) => {
      clientC.once(CutpattiServerEvent.RoomJoined, resolve);
    });
    clientC.emit(CutpattiClientEvent.JoinRoom, { roomCode, playerName: 'Charlie' });
    await joinCPromise;

    // 3. Players B and C toggle ready
    const allReadyPromise = new Promise<CutpattiClientRoom>((resolve) => {
      clientA.on(CutpattiServerEvent.RoomUpdated, (room: CutpattiClientRoom) => {
        if (room.players.length === 3 && room.players.every((p) => p.isReady)) {
          resolve(room);
        }
      });
    });

    clientB.emit(CutpattiClientEvent.ToggleReady);
    clientC.emit(CutpattiClientEvent.ToggleReady);

    const roomStateAfterReady = await allReadyPromise;
    expect(roomStateAfterReady.players.every((p) => p.isReady)).toBe(true);

    // 4. Host (Alice) starts game
    const gameStartPromiseA = new Promise<CutpattiClientGameState>((resolve) => {
      clientA.once(CutpattiServerEvent.GameStarted, resolve);
    });
    const gameStartPromiseB = new Promise<CutpattiClientGameState>((resolve) => {
      clientB.once(CutpattiServerEvent.GameStarted, resolve);
    });
    const gameStartPromiseC = new Promise<CutpattiClientGameState>((resolve) => {
      clientC.once(CutpattiServerEvent.GameStarted, resolve);
    });

    clientA.emit(CutpattiClientEvent.StartGame);

    const [stateA, stateB, stateC] = await Promise.all([
      gameStartPromiseA,
      gameStartPromiseB,
      gameStartPromiseC,
    ]);

    expect(stateA.phase).toBe('bidding');
    expect(stateA.cardsPerPlayer).toBe(16);
    expect(stateA.myHand.length).toBe(16);
    expect(stateB.myHand.length).toBe(16);
    expect(stateC.myHand.length).toBe(16);

    // 5. Submit Bids
    clientA.emit(CutpattiClientEvent.SubmitBid, { bid: 3 });
    clientB.emit(CutpattiClientEvent.SubmitBid, { bid: 4 });

    const playPhasePromise = new Promise<CutpattiClientGameState>((resolve) => {
      clientA.on(CutpattiServerEvent.GameStateUpdate, (st: CutpattiClientGameState) => {
        if (st.phase === 'playing') resolve(st);
      });
    });

    clientC.emit(CutpattiClientEvent.SubmitBid, { bid: 5 });

    const statePlaying = await playPhasePromise;
    expect(statePlaying.phase).toBe('playing');
    expect(statePlaying.bids[statePlaying.players[0].id]).toBe(3);
    expect(statePlaying.bids[statePlaying.players[1].id]).toBe(4);
    expect(statePlaying.bids[statePlaying.players[2].id]).toBe(5);

    // Clean up
    clientA.disconnect();
    clientB.disconnect();
    clientC.disconnect();
  });
});

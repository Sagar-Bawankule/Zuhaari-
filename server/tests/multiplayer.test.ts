import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import express from 'express';
import { registerHandlers } from '../src/sockets/handlers';
import { ClientEvent, ServerEvent } from '@shared/types/events';
import { Suit } from '@shared/constants';

describe('Multiplayer Socket.IO Flow', () => {
  let io: Server;
  let server: any;
  let port: number;

  beforeAll(async () => {
    const app = express();
    server = createServer(app);
    io = new Server(server);

    io.on('connection', (socket) => {
      registerHandlers(io, socket);
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

  it('should run a complete 4-player game lifecycle via Socket.IO', async () => {
    const clientA = await createClient();
    const clientB = await createClient();
    const clientC = await createClient();
    const clientD = await createClient();

    // 1. Player A creates room
    const createPromise = new Promise<any>((resolve) => {
      clientA.once(ServerEvent.RoomCreated, resolve);
    });
    clientA.emit(ClientEvent.CreateRoom, { playerName: 'Alice' });
    const { roomCode } = await createPromise;
    expect(roomCode).toBeDefined();
    expect(roomCode.length).toBe(6);

    // 2. Players B, C, D join room
    const joinB = new Promise<any>((resolve) => clientB.once(ServerEvent.RoomJoined, resolve));
    clientB.emit(ClientEvent.JoinRoom, { roomCode, playerName: 'Bob' });
    await joinB;

    const joinC = new Promise<any>((resolve) => clientC.once(ServerEvent.RoomJoined, resolve));
    clientC.emit(ClientEvent.JoinRoom, { roomCode, playerName: 'Charlie' });
    await joinC;

    const joinD = new Promise<any>((resolve) => clientD.once(ServerEvent.RoomJoined, resolve));
    clientD.emit(ClientEvent.JoinRoom, { roomCode, playerName: 'Diana' });
    await joinD;

    // 3. Test 5th player rejected
    const clientE = await createClient();
    const errorE = new Promise<any>((resolve) => clientE.once(ServerEvent.RoomError, resolve));
    clientE.emit(ClientEvent.JoinRoom, { roomCode, playerName: 'Eve' });
    const err = await errorE;
    expect(err.message).toMatch(/full/i);
    clientE.disconnect();

    // Helper: toggle ready and wait for room update showing that player as ready
    const toggleAndWaitReady = async (client: ClientSocket, name: string) => {
      return new Promise<void>((resolve) => {
        const handler = (room: any) => {
          const p = room.players.find((pl: any) => pl.name === name);
          if (p && p.isReady) {
            client.off(ServerEvent.RoomUpdated, handler);
            resolve();
          }
        };
        client.on(ServerEvent.RoomUpdated, handler);
        client.emit(ClientEvent.ToggleReady);
      });
    };

    // 4. Mark all 4 players ready sequentially
    await toggleAndWaitReady(clientA, 'Alice');
    await toggleAndWaitReady(clientB, 'Bob');
    await toggleAndWaitReady(clientC, 'Charlie');
    await toggleAndWaitReady(clientD, 'Diana');

    // 5. Start game
    const firstDealPromises = [
      new Promise<any>((resolve) => clientA.once(ServerEvent.FirstDeal, resolve)),
      new Promise<any>((resolve) => clientB.once(ServerEvent.FirstDeal, resolve)),
      new Promise<any>((resolve) => clientC.once(ServerEvent.FirstDeal, resolve)),
      new Promise<any>((resolve) => clientD.once(ServerEvent.FirstDeal, resolve)),
    ];

    clientA.emit(ClientEvent.StartGame);

    const firstDeals = await Promise.all(firstDealPromises);

    // Each player received exactly 5 cards
    for (const deal of firstDeals) {
      expect(deal.hand).toHaveLength(5);
      expect(deal.gameState.phase).toBe('cutt_decision');
    }

    // 6. Player B (Seat 1) declares Cutt
    const cuttDeclaredPromise = new Promise<any>((resolve) => {
      clientA.once(ServerEvent.CuttDeclared, resolve);
    });

    const secondDealPromises = [
      new Promise<any>((resolve) => clientA.once(ServerEvent.SecondDeal, resolve)),
      new Promise<any>((resolve) => clientB.once(ServerEvent.SecondDeal, resolve)),
      new Promise<any>((resolve) => clientC.once(ServerEvent.SecondDeal, resolve)),
      new Promise<any>((resolve) => clientD.once(ServerEvent.SecondDeal, resolve)),
    ];

    clientB.emit(ClientEvent.CuttBid, { action: 'declare', suit: Suit.Hearts });

    const cuttData = await cuttDeclaredPromise;
    expect(cuttData.decision.suit).toBe(Suit.Hearts);
    expect(cuttData.decision.target).toBe(6);

    const secondDeals = await Promise.all(secondDealPromises);

    // All players now have exactly 9 total cards
    for (const deal of secondDeals) {
      expect(deal.hand).toHaveLength(9);
      expect(deal.gameState.phase).toBe('playing');
    }

    // Clean up
    clientA.disconnect();
    clientB.disconnect();
    clientC.disconnect();
    clientD.disconnect();
  }, 15000);
});

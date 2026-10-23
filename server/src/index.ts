/**
 * Server entry point — Express + Socket.IO
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerHandlers } from './sockets/handlers';
import { registerCutpattiHandlers } from './sockets/cutpattiHandlers';

dotenv.config();

const PORT = parseInt(process.env.SERVER_PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    games: ['Zuhaari', 'Cutpatti'],
    timestamp: Date.now(),
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Player connected: ${socket.id}`);
  registerHandlers(io, socket);
  registerCutpattiHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`\n  🎴 Zuhaari Server running on http://localhost:${PORT}`);
  console.log(`  📡 Socket.IO ready for connections`);
  console.log(`  🔗 CORS origin: ${CORS_ORIGIN}\n`);
});

export { io, httpServer };

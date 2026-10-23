/**
 * Socket.IO event validation using Zod schemas.
 */
import { z } from 'zod';
import { Suit } from '@shared/constants';

export const createRoomSchema = z.object({
  playerName: z.string().min(2).max(16).trim(),
});

export const joinRoomSchema = z.object({
  roomCode: z.string().length(6).toUpperCase(),
  playerName: z.string().min(2).max(16).trim(),
});

export const selectSeatSchema = z.object({
  seatIndex: z.number().int().min(0).max(3),
});

export const reconnectSchema = z.object({
  roomCode: z.string().length(6),
  sessionToken: z.string().min(1),
});

export const cuttBidSchema = z.object({
  action: z.enum(['declare', 'pass']),
  suit: z.nativeEnum(Suit).optional(),
}).refine(
  (data) => data.action === 'pass' || data.suit !== undefined,
  { message: 'Suit is required when declaring cutt' }
);

export const playCardSchema = z.object({
  cardId: z.string().min(1),
});

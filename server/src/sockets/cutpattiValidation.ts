import { z } from 'zod';
import {
  CUTPATTI_MIN_PLAYER_NAME_LENGTH,
  CUTPATTI_MAX_PLAYER_NAME_LENGTH,
  CUTPATTI_MIN_BID,
} from '@shared/cutpatti/constants';

export const createCutpattiRoomSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(CUTPATTI_MIN_PLAYER_NAME_LENGTH, `Name must be at least ${CUTPATTI_MIN_PLAYER_NAME_LENGTH} characters`)
    .max(CUTPATTI_MAX_PLAYER_NAME_LENGTH, `Name must be at most ${CUTPATTI_MAX_PLAYER_NAME_LENGTH} characters`),
});

export const joinCutpattiRoomSchema = z.object({
  roomCode: z.string().trim().min(1, 'Room code is required'),
  playerName: z
    .string()
    .trim()
    .min(CUTPATTI_MIN_PLAYER_NAME_LENGTH, `Name must be at least ${CUTPATTI_MIN_PLAYER_NAME_LENGTH} characters`)
    .max(CUTPATTI_MAX_PLAYER_NAME_LENGTH, `Name must be at most ${CUTPATTI_MAX_PLAYER_NAME_LENGTH} characters`),
});

export const reconnectCutpattiSchema = z.object({
  roomCode: z.string().trim().min(1, 'Room code is required'),
  sessionToken: z.string().trim().min(1, 'Session token is required'),
});

export const submitCutpattiBidSchema = z.object({
  bid: z.number().int('Bid must be an integer').min(CUTPATTI_MIN_BID, `Bid must be at least ${CUTPATTI_MIN_BID}`),
});

export const playCutpattiCardSchema = z.object({
  cardId: z.string().trim().min(1, 'Card ID is required'),
});

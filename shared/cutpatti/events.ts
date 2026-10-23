import { CutpattiClientGameState, CutpattiClientRoom, CutpattiCompletedTrick, CutpattiPlayedCard, CutpattiRoundResult } from './types';

// ─── Cutpatti Socket.IO Event Names ───────────────────────

export enum CutpattiClientEvent {
  CreateRoom = 'cutpatti:room:create',
  JoinRoom = 'cutpatti:room:join',
  LeaveRoom = 'cutpatti:room:leave',
  ToggleReady = 'cutpatti:room:toggle_ready',
  StartGame = 'cutpatti:room:start_game',
  Reconnect = 'cutpatti:room:reconnect',

  SubmitBid = 'cutpatti:game:submit_bid',
  PlayCard = 'cutpatti:game:play_card',
  NextRound = 'cutpatti:game:next_round',
}

export enum CutpattiServerEvent {
  RoomCreated = 'cutpatti:room:created',
  RoomJoined = 'cutpatti:room:joined',
  RoomUpdated = 'cutpatti:room:updated',
  RoomError = 'cutpatti:room:error',

  GameStarted = 'cutpatti:game:started',
  GameStateUpdate = 'cutpatti:game:state_update',
  BiddingUpdate = 'cutpatti:game:bidding_update',
  CardPlayed = 'cutpatti:game:card_played',
  TrickComplete = 'cutpatti:game:trick_complete',
  RoundComplete = 'cutpatti:game:round_complete',
  GameError = 'cutpatti:game:error',
}

// ─── Client Payloads ──────────────────────────────────────

export interface CutpattiCreateRoomPayload {
  playerName: string;
}

export interface CutpattiJoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface CutpattiReconnectPayload {
  roomCode: string;
  sessionToken: string;
}

export interface CutpattiSubmitBidPayload {
  bid: number;
}

export interface CutpattiPlayCardPayload {
  cardId: string;
}

// ─── Server Payloads ──────────────────────────────────────

export interface CutpattiRoomCreatedPayload {
  roomCode: string;
  sessionToken: string;
  playerId: string;
}

export interface CutpattiRoomJoinedPayload {
  roomCode: string;
  sessionToken: string;
  playerId: string;
}

export interface CutpattiRoomErrorPayload {
  message: string;
  code?: string;
}

export interface CutpattiGameErrorPayload {
  message: string;
  code?: string;
}

export interface CutpattiBiddingUpdatePayload {
  playerId: string;
  hasBid: boolean;
  totalBidsReceived: number;
  totalPlayers: number;
}

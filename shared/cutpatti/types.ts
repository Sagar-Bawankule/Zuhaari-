import { RoomStatus } from '../types/index';
import {
  CutpattiCard,
  CutpattiSuit,
} from './constants';

// ─── Player Types ─────────────────────────────────────────

export interface CutpattiPlayer {
  id: string; // Socket session ID
  name: string;
  seatIndex: number; // 0 .. playerCount - 1
  isReady: boolean;
  isConnected: boolean;
  sessionToken: string;
  isHost: boolean;
}

export interface CutpattiPublicPlayer {
  id: string;
  name: string;
  seatIndex: number;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;
  cardCount: number;
  bid: number | null;
  tricksWon: number;
  roundScore: number | null;
  totalScore: number;
}

// ─── Phases ───────────────────────────────────────────────

export enum CutpattiPhase {
  WaitingForPlayers = 'waiting_for_players',
  Dealing = 'dealing',
  Bidding = 'bidding',
  Playing = 'playing',
  TrickComplete = 'trick_complete',
  RoundComplete = 'round_complete',
}

// ─── Trick Types ──────────────────────────────────────────

export interface CutpattiPlayedCard {
  playerId: string;
  seatIndex: number;
  playerName: string;
  card: CutpattiCard;
}

export interface CutpattiCompletedTrick {
  trickNumber: number;
  cards: CutpattiPlayedCard[];
  winnerId: string;
  winnerSeat: number;
  winnerName: string;
  winningCard: CutpattiCard;
}

// ─── Game State (Server) ──────────────────────────────────

export interface CutpattiGameState {
  phase: CutpattiPhase;
  trumpSuit: CutpattiSuit;
  cardsPerPlayer: number;
  totalTricks: number;
  currentTrickNumber: number;
  leadSuit: CutpattiSuit | null;
  currentTurnSeat: number;
  currentTrick: CutpattiPlayedCard[];
  completedTricks: CutpattiCompletedTrick[];
  playerHands: Map<string, CutpattiCard[]>; // Private hands
  bids: Record<string, number>;
  tricksWon: Record<string, number>;
  roundScores: Record<string, number>;
  totalScores: Record<string, number>;
  excludedCardIds: string[];
  roundNumber: number;
}

// ─── Game State (Client) ──────────────────────────────────

export interface CutpattiClientGameState {
  phase: CutpattiPhase;
  trumpSuit: CutpattiSuit;
  cardsPerPlayer: number;
  totalTricks: number;
  currentTrickNumber: number;
  leadSuit: CutpattiSuit | null;
  currentTurnSeat: number;
  currentTrick: CutpattiPlayedCard[];
  completedTricks: CutpattiCompletedTrick[];
  myHand: CutpattiCard[];
  opponentCardCounts: Record<string, number>;
  bids: Record<string, number>;
  tricksWon: Record<string, number>;
  roundScores: Record<string, number>;
  totalScores: Record<string, number>;
  excludedCardIds: string[];
  roundNumber: number;
  players: CutpattiPublicPlayer[];
}

// ─── Room Types ───────────────────────────────────────────

export interface CutpattiRoom {
  code: string;
  status: RoomStatus;
  players: CutpattiPlayer[];
  hostId: string;
  gameState: CutpattiGameState | null;
  createdAt: number;
}

export interface CutpattiClientRoom {
  code: string;
  status: RoomStatus;
  hostId: string;
  players: CutpattiPublicPlayer[];
}

// ─── Round Result / Leaderboard ───────────────────────────

export interface CutpattiPlayerScoreResult {
  playerId: string;
  name: string;
  seatIndex: number;
  bid: number;
  tricksWon: number;
  roundScore: number;
  totalScore: number;
}

export interface CutpattiLeaderboardEntry {
  playerId: string;
  name: string;
  totalScore: number;
  rank: number;
}

export interface CutpattiRoundResult {
  roundNumber: number;
  trumpSuit: CutpattiSuit;
  playerResults: CutpattiPlayerScoreResult[];
  leaderboard: CutpattiLeaderboardEntry[];
}

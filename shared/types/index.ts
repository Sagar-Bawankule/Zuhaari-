import type { Card, HiddenCard, SeatIndex, Suit, TeamId } from '../constants';

// ─── Player ──────────────────────────────────────────────
export interface Player {
  id: string;          // unique socket-session id
  name: string;
  seatIndex: SeatIndex;
  team: TeamId;
  isReady: boolean;
  isConnected: boolean;
  sessionToken: string; // for reconnection
}

/** Player info visible to all clients */
export interface PublicPlayer {
  id: string;
  name: string;
  seatIndex: SeatIndex;
  team: TeamId;
  isReady: boolean;
  isConnected: boolean;
  cardCount: number;
}

// ─── Cutt ────────────────────────────────────────────────
export enum CuttType {
  Default = 'default',
  Declared = 'declared',
}

export interface CuttDecision {
  declaringPlayerId: string;
  declaringTeam: TeamId;
  suit: Suit;
  type: CuttType;
  target: number; // 5 for default, 6 for declared
}

export type CuttBidAction =
  | { action: 'declare'; suit: Suit }
  | { action: 'pass' };

// ─── Hand / Trick ────────────────────────────────────────
export interface PlayedCard {
  playerId: string;
  seatIndex: SeatIndex;
  card: Card;
}

export interface CompletedHand {
  handNumber: number;
  cards: PlayedCard[];
  winnerId: string;
  winnerSeat: SeatIndex;
  winningTeam: TeamId;
}

// ─── Game Phase ──────────────────────────────────────────
export enum GamePhase {
  WaitingForPlayers = 'waiting_for_players',
  FirstDeal = 'first_deal',
  CuttDecision = 'cutt_decision',
  SecondDeal = 'second_deal',
  Playing = 'playing',
  HandComplete = 'hand_complete',
  RoundComplete = 'round_complete',
}

// ─── Game State (Server) ─────────────────────────────────
export interface GameState {
  phase: GamePhase;
  deck: Card[];
  playerHands: Map<string, Card[]>; // playerId -> their cards
  currentTurnSeat: SeatIndex;
  currentHand: PlayedCard[];
  completedHands: CompletedHand[];
  cuttDecision: CuttDecision | null;
  cuttBiddingSeat: SeatIndex;       // whose turn to bid
  cuttPassCount: number;            // how many players have passed
  leadSuit: Suit | null;
  handNumber: number;
  teamHandsWon: Record<TeamId, number>;
}

// ─── Client Game State ───────────────────────────────────
export interface ClientGameState {
  phase: GamePhase;
  myHand: Card[];
  opponentCardCounts: Record<string, number>;
  currentTurnSeat: SeatIndex;
  currentHand: PlayedCard[];
  completedHands: CompletedHand[];
  cuttDecision: CuttDecision | null;
  cuttBiddingSeat: SeatIndex;
  leadSuit: Suit | null;
  handNumber: number;
  teamHandsWon: Record<TeamId, number>;
  players: PublicPlayer[];
}

// ─── Room ────────────────────────────────────────────────
export enum RoomStatus {
  Lobby = 'lobby',
  InGame = 'in_game',
  Finished = 'finished',
}

export interface Room {
  code: string;
  status: RoomStatus;
  players: Player[];
  gameState: GameState | null;
  createdAt: number;
}

export interface ClientRoom {
  code: string;
  status: RoomStatus;
  players: PublicPlayer[];
}

// ─── Round Result ────────────────────────────────────────
export interface RoundResult {
  winningTeam: TeamId;
  teamHandsWon: Record<TeamId, number>;
  cuttDecision: CuttDecision;
  cuttTargetMet: boolean;
  completedHands: CompletedHand[];
}

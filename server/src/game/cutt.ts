/**
 * Cutt (trump) declaration logic.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║ CONFIGURABLE CUTT RULES                                        ║
 * ║                                                                ║
 * ║ The exact cutt bidding sequence is partially unspecified.       ║
 * ║ This module implements a configurable system:                   ║
 * ║                                                                ║
 * ║ Default behavior:                                              ║
 * ║ - After the first 5 cards are dealt, Player A leads.           ║
 * ║ - Player B gets the first chance to declare cutt.              ║
 * ║ - Bidding proceeds: B → C → D → A.                            ║
 * ║ - A player may declare a suit (declared cutt, target = 6)      ║
 * ║   or pass.                                                     ║
 * ║ - If all 4 players pass, Player B must make a default          ║
 * ║   cutt (target = 5) — they choose a suit but the bar is lower. ║
 * ║                                                                ║
 * ║ TO CUSTOMIZE: modify CuttConfig below.                         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
import {
  DEFAULT_CUTT_TARGET,
  DECLARED_CUTT_TARGET,
  PLAYERS_PER_GAME,
  type SeatIndex,
  type Suit,
} from '@shared/constants';
import { CuttType, type CuttDecision } from '@shared/types/index';

// ─── Configurable Rules ──────────────────────────────────
export interface CuttConfig {
  /** Seat order for cutt bidding. Default: [1, 2, 3, 0] (B, C, D, A) */
  biddingOrder: SeatIndex[];
  /** Target for a declared cutt. Default: 6 */
  declaredTarget: number;
  /** Target for a default cutt. Default: 5 */
  defaultTarget: number;
  /** Seat that must make default cutt if all pass. Default: 1 (Player B) */
  defaultCuttSeat: SeatIndex;
}

export const DEFAULT_CUTT_CONFIG: CuttConfig = {
  biddingOrder: [1, 2, 3, 0],
  declaredTarget: DECLARED_CUTT_TARGET,
  defaultTarget: DEFAULT_CUTT_TARGET,
  defaultCuttSeat: 1,
};

// ─── Cutt State Machine ─────────────────────────────────

export interface CuttState {
  config: CuttConfig;
  biddingIndex: number;     // index into biddingOrder
  passCount: number;
  decision: CuttDecision | null;
  isComplete: boolean;
}

export function createCuttState(config: CuttConfig = DEFAULT_CUTT_CONFIG): CuttState {
  return {
    config,
    biddingIndex: 0,
    passCount: 0,
    decision: null,
    isComplete: false,
  };
}

/** Get which seat is currently bidding. */
export function getCurrentBiddingSeat(state: CuttState): SeatIndex {
  return state.config.biddingOrder[state.biddingIndex];
}

/** Check if a seat is allowed to bid right now. */
export function canBid(state: CuttState, seatIndex: SeatIndex): boolean {
  if (state.isComplete) return false;
  return getCurrentBiddingSeat(state) === seatIndex;
}

/**
 * Process a declare action.
 * Returns the new CuttState (immutable).
 */
export function processDeclare(
  state: CuttState,
  seatIndex: SeatIndex,
  suit: Suit,
  playerId: string,
  teamId: string,
): CuttState {
  if (!canBid(state, seatIndex)) {
    throw new Error(`Seat ${seatIndex} cannot bid right now`);
  }

  const decision: CuttDecision = {
    declaringPlayerId: playerId,
    declaringTeam: teamId as any,
    suit,
    type: CuttType.Declared,
    target: state.config.declaredTarget,
  };

  return {
    ...state,
    decision,
    isComplete: true,
  };
}

/**
 * Process a pass action.
 * If all players pass, forces a default cutt on the configured seat.
 */
export function processPass(
  state: CuttState,
  seatIndex: SeatIndex,
): CuttState {
  if (!canBid(state, seatIndex)) {
    throw new Error(`Seat ${seatIndex} cannot bid right now`);
  }

  const newPassCount = state.passCount + 1;
  const newBiddingIndex = state.biddingIndex + 1;

  // All players passed — need default cutt
  if (newPassCount >= PLAYERS_PER_GAME) {
    return {
      ...state,
      passCount: newPassCount,
      biddingIndex: newBiddingIndex,
      // Not complete yet — default cutt seat must pick a suit
      isComplete: false,
    };
  }

  return {
    ...state,
    passCount: newPassCount,
    biddingIndex: newBiddingIndex,
  };
}

/** Check if we're in default-cutt-required state (all passed). */
export function isDefaultCuttRequired(state: CuttState): boolean {
  return state.passCount >= PLAYERS_PER_GAME && !state.isComplete;
}

/**
 * Process a default cutt declaration (forced when all pass).
 */
export function processDefaultCutt(
  state: CuttState,
  suit: Suit,
  playerId: string,
  teamId: string,
): CuttState {
  if (!isDefaultCuttRequired(state)) {
    throw new Error('Default cutt is not required');
  }

  const decision: CuttDecision = {
    declaringPlayerId: playerId,
    declaringTeam: teamId as any,
    suit,
    type: CuttType.Default,
    target: state.config.defaultTarget,
  };

  return {
    ...state,
    decision,
    isComplete: true,
  };
}

import {
  CutpattiLeaderboardEntry,
  CutpattiPlayerScoreResult,
  CutpattiRoundResult,
} from '@shared/cutpatti/types';
import { CutpattiSuit } from '@shared/cutpatti/constants';

/**
 * Calculates a single player's round score in Call Break fashion:
 *
 * - If tricksWon >= bid: award `bid + 0.1 * (tricksWon - bid)`
 * - If tricksWon < bid: subtract `bid` (i.e. `-bid`)
 */
export function calculatePlayerScore(bid: number, tricksWon: number): number {
  let score: number;
  if (tricksWon >= bid) {
    const extraTricks = tricksWon - bid;
    score = bid + extraTricks * 0.1;
  } else {
    score = -bid;
  }
  // Avoid JS floating-point imprecision (e.g. 3.1000000000000005)
  return Math.round(score * 10) / 10;
}

/**
 * Calculates round scores for all players.
 */
export function calculateRoundScores(
  bids: Record<string, number>,
  tricksWon: Record<string, number>,
  playerIds: string[]
): Record<string, number> {
  const roundScores: Record<string, number> = {};
  for (const id of playerIds) {
    const bid = bids[id] ?? 1;
    const won = tricksWon[id] ?? 0;
    roundScores[id] = calculatePlayerScore(bid, won);
  }
  return roundScores;
}

/**
 * Updates cumulative scores across multiple rounds.
 */
export function updateCumulativeScores(
  previousTotals: Record<string, number>,
  roundScores: Record<string, number>,
  playerIds: string[]
): Record<string, number> {
  const newTotals: Record<string, number> = {};
  for (const id of playerIds) {
    const prev = previousTotals[id] ?? 0;
    const round = roundScores[id] ?? 0;
    newTotals[id] = Math.round((prev + round) * 10) / 10;
  }
  return newTotals;
}

/**
 * Builds leaderboard sorted descending by total score.
 */
export function buildLeaderboard(
  players: Array<{ id: string; name: string }>,
  totalScores: Record<string, number>
): CutpattiLeaderboardEntry[] {
  const list = players.map((p) => ({
    playerId: p.id,
    name: p.name,
    totalScore: totalScores[p.id] ?? 0,
    rank: 1,
  }));

  list.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks
  for (let i = 0; i < list.length; i++) {
    if (i > 0 && list[i].totalScore === list[i - 1].totalScore) {
      list[i].rank = list[i - 1].rank;
    } else {
      list[i].rank = i + 1;
    }
  }

  return list;
}

/**
 * Builds complete round result summary.
 */
export function buildRoundResult(
  roundNumber: number,
  trumpSuit: CutpattiSuit,
  players: Array<{ id: string; name: string; seatIndex: number }>,
  bids: Record<string, number>,
  tricksWon: Record<string, number>,
  roundScores: Record<string, number>,
  totalScores: Record<string, number>
): CutpattiRoundResult {
  const playerResults: CutpattiPlayerScoreResult[] = players.map((p) => ({
    playerId: p.id,
    name: p.name,
    seatIndex: p.seatIndex,
    bid: bids[p.id] ?? 1,
    tricksWon: tricksWon[p.id] ?? 0,
    roundScore: roundScores[p.id] ?? 0,
    totalScore: totalScores[p.id] ?? 0,
  }));

  const leaderboard = buildLeaderboard(players, totalScores);

  return {
    roundNumber,
    trumpSuit,
    playerResults,
    leaderboard,
  };
}

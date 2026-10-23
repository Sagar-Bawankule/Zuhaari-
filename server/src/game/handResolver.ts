/**
 * Hand (trick) resolution — determines the winner of a completed hand.
 */
import type { Suit } from '@shared/constants';
import type { PlayedCard } from '@shared/types/index';
import { SEAT_TEAM } from '@shared/constants';
import { compareCards } from './rules';

export interface HandResult {
  winnerId: string;
  winnerSeat: number;
  winningTeam: string;
  winningCard: PlayedCard;
}

/**
 * Resolve a completed hand (4 played cards) to determine the winner.
 *
 * The lead suit is determined by the first card played.
 * Trump suit beats everything. Otherwise, highest lead-suit card wins.
 */
export function resolveHand(
  playedCards: PlayedCard[],
  trumpSuit: Suit,
): HandResult {
  if (playedCards.length !== 4) {
    throw new Error(`Hand must have 4 cards, got ${playedCards.length}`);
  }

  const leadSuit = playedCards[0].card.suit;

  let winner = playedCards[0];
  for (let i = 1; i < playedCards.length; i++) {
    winner = compareCards(winner, playedCards[i], leadSuit, trumpSuit);
  }

  return {
    winnerId: winner.playerId,
    winnerSeat: winner.seatIndex,
    winningTeam: SEAT_TEAM[winner.seatIndex],
    winningCard: winner,
  };
}

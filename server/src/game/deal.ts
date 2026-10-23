/**
 * Card dealing — two-stage distribution of cards to four players.
 */
import {
  CARDS_PER_PLAYER,
  FIRST_DEAL_COUNT,
  PLAYERS_PER_GAME,
  SECOND_DEAL_COUNT,
  type Card,
} from '@shared/constants';

export interface DealResult {
  /** First 5 cards for each player, keyed by player index 0-3 */
  firstDeal: Card[][];
  /** Remaining 4 cards for each player */
  secondDeal: Card[][];
}

/**
 * Deal cards from a shuffled deck in two stages.
 * Stage 1: 5 cards each (20 cards total).
 * Stage 2: 4 cards each (16 cards total).
 * Total: 36 cards distributed to 4 players (9 each).
 */
export function dealCards(deck: Card[]): DealResult {
  if (deck.length !== PLAYERS_PER_GAME * CARDS_PER_PLAYER) {
    throw new Error(`Expected ${PLAYERS_PER_GAME * CARDS_PER_PLAYER} cards, got ${deck.length}`);
  }

  const firstDeal: Card[][] = [[], [], [], []];
  const secondDeal: Card[][] = [[], [], [], []];

  let cardIndex = 0;

  // Stage 1: 5 cards to each player
  for (let round = 0; round < FIRST_DEAL_COUNT; round++) {
    for (let player = 0; player < PLAYERS_PER_GAME; player++) {
      firstDeal[player].push(deck[cardIndex++]);
    }
  }

  // Stage 2: 4 cards to each player
  for (let round = 0; round < SECOND_DEAL_COUNT; round++) {
    for (let player = 0; player < PLAYERS_PER_GAME; player++) {
      secondDeal[player].push(deck[cardIndex++]);
    }
  }

  // Validate
  for (let i = 0; i < PLAYERS_PER_GAME; i++) {
    if (firstDeal[i].length !== FIRST_DEAL_COUNT) {
      throw new Error(`Player ${i} first deal: expected ${FIRST_DEAL_COUNT}, got ${firstDeal[i].length}`);
    }
    if (secondDeal[i].length !== SECOND_DEAL_COUNT) {
      throw new Error(`Player ${i} second deal: expected ${SECOND_DEAL_COUNT}, got ${secondDeal[i].length}`);
    }
  }

  return { firstDeal, secondDeal };
}

/**
 * Deck creation — builds the 36-card deck (ranks 6–A × 4 suits).
 */
import {
  ALL_RANKS,
  ALL_SUITS,
  RANK_STRENGTH,
  TOTAL_CARDS,
  type Card,
  type Rank,
  type Suit,
} from '@shared/constants';

/** Create a card ID from rank + suit */
export function cardId(rank: Rank, suit: Suit): string {
  return `${rank}_${suit}`;
}

/** Build the full 36-card deck, unshuffled. */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push({
        id: cardId(rank, suit),
        rank,
        suit,
        strength: RANK_STRENGTH[rank],
      });
    }
  }
  if (deck.length !== TOTAL_CARDS) {
    throw new Error(`Deck must have ${TOTAL_CARDS} cards, got ${deck.length}`);
  }
  return deck;
}

/** Validate that a deck has exactly 36 unique cards. */
export function validateDeck(deck: Card[]): boolean {
  if (deck.length !== TOTAL_CARDS) return false;
  const ids = new Set(deck.map(c => c.id));
  return ids.size === TOTAL_CARDS;
}

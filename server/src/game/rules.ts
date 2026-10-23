/**
 * Card-playing rules — suit following, trump, and move validation.
 */
import {
  RANK_STRENGTH,
  type Card,
  type Suit,
} from '@shared/constants';
import type { PlayedCard } from '@shared/types/index';

/**
 * Check if a player can legally play a given card.
 *
 * Rules:
 * - The first player in a hand may play any card (they set the lead suit).
 * - Subsequent players MUST follow the lead suit if they hold at least one card of that suit.
 * - If a player has no cards of the lead suit, they may play any card (including trump).
 */
export function isLegalMove(
  card: Card,
  playerHand: Card[],
  leadSuit: Suit | null,
): boolean {
  // First card in the hand — any card is legal
  if (leadSuit === null) return true;

  // Check if player has any cards of the lead suit
  const hasLeadSuit = playerHand.some(c => c.suit === leadSuit);

  // If player has lead suit cards, they must play one
  if (hasLeadSuit) {
    return card.suit === leadSuit;
  }

  // If player has no lead suit cards, any card is legal
  return true;
}

/**
 * Get all legal cards a player can play from their hand.
 */
export function getLegalMoves(
  playerHand: Card[],
  leadSuit: Suit | null,
): Card[] {
  return playerHand.filter(card => isLegalMove(card, playerHand, leadSuit));
}

/**
 * Compare two cards for strength within a context.
 * Returns the stronger card considering trump and lead suit.
 */
export function compareCards(
  a: PlayedCard,
  b: PlayedCard,
  leadSuit: Suit,
  trumpSuit: Suit,
): PlayedCard {
  const aIsTrump = a.card.suit === trumpSuit;
  const bIsTrump = b.card.suit === trumpSuit;

  // Both trump — highest rank wins
  if (aIsTrump && bIsTrump) {
    return RANK_STRENGTH[a.card.rank] >= RANK_STRENGTH[b.card.rank] ? a : b;
  }

  // Only one is trump — trump wins
  if (aIsTrump) return a;
  if (bIsTrump) return b;

  // Neither is trump — only lead suit cards can win
  const aIsLead = a.card.suit === leadSuit;
  const bIsLead = b.card.suit === leadSuit;

  if (aIsLead && !bIsLead) return a;
  if (!aIsLead && bIsLead) return b;

  // Both lead suit — highest rank wins
  if (aIsLead && bIsLead) {
    return RANK_STRENGTH[a.card.rank] >= RANK_STRENGTH[b.card.rank] ? a : b;
  }

  // Neither lead suit (both off-suit, non-trump) — first played holds
  return a;
}

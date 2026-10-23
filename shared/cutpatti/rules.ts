import { CutpattiCard, CutpattiSuit } from './constants';

/**
 * Returns all legal cards that can be played from the given hand.
 *
 * Rules:
 * 1. If leading (leadSuit is null), all cards in the hand are legal.
 * 2. If following suit:
 *    - If the player holds at least one card of the lead suit, they MUST play a lead suit card.
 *    - If the player holds NO cards of the lead suit (void in lead suit), they may play any card (trump or non-trump).
 */
export function getLegalCards(
  hand: CutpattiCard[],
  leadSuit: CutpattiSuit | null
): CutpattiCard[] {
  if (!leadSuit) {
    return [...hand];
  }

  const cardsOfLeadSuit = hand.filter((c) => c.suit === leadSuit);
  if (cardsOfLeadSuit.length > 0) {
    return cardsOfLeadSuit;
  }

  // Void in lead suit — player may play any card
  return [...hand];
}

/**
 * Determines whether a specific card is legal to play.
 */
export function isCardLegal(
  cardId: string,
  hand: CutpattiCard[],
  leadSuit: CutpattiSuit | null
): boolean {
  const cardInHand = hand.find((c) => c.id === cardId);
  if (!cardInHand) {
    return false;
  }

  const legalCards = getLegalCards(hand, leadSuit);
  return legalCards.some((c) => c.id === cardId);
}

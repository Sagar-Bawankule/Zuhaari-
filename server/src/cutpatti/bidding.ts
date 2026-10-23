import { CUTPATTI_MIN_BID } from '@shared/cutpatti/constants';

export interface BidValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates a player's trick bid for the round.
 */
export function validateBid(
  bid: number,
  cardsPerPlayer: number,
  minBid = CUTPATTI_MIN_BID
): BidValidationResult {
  if (!Number.isInteger(bid)) {
    return { valid: false, reason: 'Bid must be an integer' };
  }
  if (bid < minBid) {
    return { valid: false, reason: `Bid must be at least ${minBid}` };
  }
  if (bid > cardsPerPlayer) {
    return {
      valid: false,
      reason: `Bid cannot exceed total tricks available (${cardsPerPlayer})`,
    };
  }
  return { valid: true };
}

/**
 * Checks whether all connected players have submitted their bids.
 */
export function areAllBidsSubmitted(
  bids: Record<string, number>,
  playerIds: string[]
): boolean {
  return playerIds.every((id) => typeof bids[id] === 'number');
}

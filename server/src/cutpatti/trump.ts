import { CutpattiSuit, CUTPATTI_ALL_SUITS } from '@shared/cutpatti/constants';
import crypto from 'crypto';

/**
 * Randomly select a trump suit using cryptographically secure random integers.
 */
export function selectRandomTrump(customIndex?: number): CutpattiSuit {
  const index = customIndex !== undefined ? customIndex : crypto.randomInt(0, CUTPATTI_ALL_SUITS.length);
  return CUTPATTI_ALL_SUITS[index % CUTPATTI_ALL_SUITS.length];
}

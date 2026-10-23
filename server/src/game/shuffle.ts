/**
 * Cryptographically secure Fisher-Yates shuffle.
 */
import crypto from 'crypto';
import type { Card } from '@shared/constants';

/** Fisher-Yates shuffle using crypto.randomInt for security. */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deterministic shuffle for testing — uses a seed-based PRNG.
 * NOT for production use.
 */
export function deterministicShuffle(deck: Card[], seed: number): Card[] {
  const shuffled = [...deck];
  let state = seed;
  const nextRandom = () => {
    state = (state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (state >>> 0) / 0xFFFFFFFF;
  };
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

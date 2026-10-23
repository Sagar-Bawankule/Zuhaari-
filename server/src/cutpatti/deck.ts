import {
  CutpattiCard,
  CutpattiRank,
  CutpattiSuit,
  CUTPATTI_ALL_RANKS,
  CUTPATTI_ALL_SUITS,
  CUTPATTI_RANK_STRENGTH,
} from '@shared/cutpatti/constants';
import crypto from 'crypto';

/**
 * Creates a standard, un-shuffled 52-card deck.
 * Ranks 2 through Ace in all 4 suits.
 */
export function create52CardDeck(): CutpattiCard[] {
  const deck: CutpattiCard[] = [];
  for (const suit of CUTPATTI_ALL_SUITS) {
    for (const rank of CUTPATTI_ALL_RANKS) {
      deck.push({
        id: `${rank}_${suit}`,
        rank,
        suit,
        strength: CUTPATTI_RANK_STRENGTH[rank],
      });
    }
  }
  return deck;
}

/**
 * Cryptographically secure Fisher-Yates shuffle.
 */
export function shuffleCutpattiDeck(deck: CutpattiCard[]): CutpattiCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

import { CutpattiCard, CutpattiSuit } from '@shared/cutpatti/constants';
import { CutpattiPlayedCard } from '@shared/cutpatti/types';

export interface TrickResult {
  winner: CutpattiPlayedCard;
  winningCard: CutpattiCard;
}

/**
 * Resolves the winner of a completed trick according to Cutpatti trick rules:
 *
 * 1. The first card played sets the lead suit.
 * 2. If any cards of the trump suit were played, the highest-ranking trump wins.
 * 3. If no trump was played, the highest-ranking card of the lead suit wins.
 * 4. Cards of other non-trump suits cannot win.
 */
export function resolveCutpattiTrick(
  playedCards: CutpattiPlayedCard[],
  trumpSuit: CutpattiSuit
): TrickResult {
  if (playedCards.length === 0) {
    throw new Error('Cannot resolve an empty trick');
  }

  const leadCard = playedCards[0];
  const leadSuit = leadCard.card.suit;

  // Check for trumps
  const trumpPlays = playedCards.filter((p) => p.card.suit === trumpSuit);

  if (trumpPlays.length > 0) {
    // Highest strength trump wins
    let best = trumpPlays[0];
    for (let i = 1; i < trumpPlays.length; i++) {
      if (trumpPlays[i].card.strength > best.card.strength) {
        best = trumpPlays[i];
      }
    }
    return { winner: best, winningCard: best.card };
  }

  // No trump played -> highest strength of lead suit wins
  const leadPlays = playedCards.filter((p) => p.card.suit === leadSuit);
  let best = leadPlays[0];
  for (let i = 1; i < leadPlays.length; i++) {
    if (leadPlays[i].card.strength > best.card.strength) {
      best = leadPlays[i];
    }
  }

  return { winner: best, winningCard: best.card };
}

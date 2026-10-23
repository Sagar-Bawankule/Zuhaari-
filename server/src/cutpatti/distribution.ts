import { CutpattiCard, getDistributionPlan, CUTPATTI_MIN_PLAYERS, CUTPATTI_MAX_PLAYERS } from '@shared/cutpatti/constants';
import { create52CardDeck, shuffleCutpattiDeck } from './deck';

export interface PreparedCutpattiDeck {
  deck: CutpattiCard[];
  excludedCards: CutpattiCard[];
  cardsPerPlayer: number;
  cardsUsed: number;
}

/**
 * Prepares and filters the deck according to the player count.
 * Excludes the lowest ranking cards (2s) deterministically.
 */
export function prepareDeckForPlayers(playerCount: number, customDeck?: CutpattiCard[]): PreparedCutpattiDeck {
  if (playerCount < CUTPATTI_MIN_PLAYERS || playerCount > CUTPATTI_MAX_PLAYERS) {
    throw new Error(`Cutpatti requires 3 to 6 players, got ${playerCount}`);
  }

  const plan = getDistributionPlan(playerCount);
  const fullDeck = customDeck || create52CardDeck();
  const removedSet = new Set(plan.removedCardIds);

  const excludedCards: CutpattiCard[] = [];
  const playableDeck: CutpattiCard[] = [];

  for (const card of fullDeck) {
    if (removedSet.has(card.id)) {
      excludedCards.push(card);
    } else {
      playableDeck.push(card);
    }
  }

  if (playableDeck.length !== plan.cardsUsed) {
    throw new Error(
      `Prepared deck length ${playableDeck.length} does not match expected cardsUsed ${plan.cardsUsed}`
    );
  }

  return {
    deck: playableDeck,
    excludedCards,
    cardsPerPlayer: plan.cardsPerPlayer,
    cardsUsed: plan.cardsUsed,
  };
}

/**
 * Deals cards equally to all players.
 * Returns an array of hands (one hand per player).
 */
export function dealCutpattiHands(
  deck: CutpattiCard[],
  playerCount: number,
  cardsPerPlayer: number,
  shuffle = true
): { hands: CutpattiCard[][]; dealtDeck: CutpattiCard[] } {
  const workingDeck = shuffle ? shuffleCutpattiDeck(deck) : [...deck];
  const hands: CutpattiCard[][] = Array.from({ length: playerCount }, () => []);

  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let p = 0; p < playerCount; p++) {
      const card = workingDeck.pop();
      if (!card) {
        throw new Error('Not enough cards in deck during deal');
      }
      hands[p].push(card);
    }
  }

  return { hands, dealtDeck: workingDeck };
}

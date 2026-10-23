// ─── Cutpatti Constants ───────────────────────────────────

export enum CutpattiSuit {
  Spades = 'spades',
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
}

export const CUTPATTI_SUIT_SYMBOLS: Record<CutpattiSuit, string> = {
  [CutpattiSuit.Spades]: '♠',
  [CutpattiSuit.Hearts]: '♥',
  [CutpattiSuit.Diamonds]: '♦',
  [CutpattiSuit.Clubs]: '♣',
};

export const CUTPATTI_SUIT_COLORS: Record<CutpattiSuit, 'red' | 'black'> = {
  [CutpattiSuit.Spades]: 'black',
  [CutpattiSuit.Hearts]: 'red',
  [CutpattiSuit.Diamonds]: 'red',
  [CutpattiSuit.Clubs]: 'black',
};

export enum CutpattiRank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export const CUTPATTI_RANK_STRENGTH: Record<CutpattiRank, number> = {
  [CutpattiRank.Two]: 1,
  [CutpattiRank.Three]: 2,
  [CutpattiRank.Four]: 3,
  [CutpattiRank.Five]: 4,
  [CutpattiRank.Six]: 5,
  [CutpattiRank.Seven]: 6,
  [CutpattiRank.Eight]: 7,
  [CutpattiRank.Nine]: 8,
  [CutpattiRank.Ten]: 9,
  [CutpattiRank.Jack]: 10,
  [CutpattiRank.Queen]: 11,
  [CutpattiRank.King]: 12,
  [CutpattiRank.Ace]: 13,
};

export const CUTPATTI_ALL_RANKS: CutpattiRank[] = [
  CutpattiRank.Two,
  CutpattiRank.Three,
  CutpattiRank.Four,
  CutpattiRank.Five,
  CutpattiRank.Six,
  CutpattiRank.Seven,
  CutpattiRank.Eight,
  CutpattiRank.Nine,
  CutpattiRank.Ten,
  CutpattiRank.Jack,
  CutpattiRank.Queen,
  CutpattiRank.King,
  CutpattiRank.Ace,
];

export const CUTPATTI_ALL_SUITS: CutpattiSuit[] = [
  CutpattiSuit.Spades,
  CutpattiSuit.Hearts,
  CutpattiSuit.Diamonds,
  CutpattiSuit.Clubs,
];

export interface CutpattiCard {
  id: string; // e.g. "2_hearts", "A_spades"
  rank: CutpattiRank;
  suit: CutpattiSuit;
  strength: number; // 1 to 13
}

// ─── Game Bounds ──────────────────────────────────────────
export const CUTPATTI_MIN_PLAYERS = 3;
export const CUTPATTI_MAX_PLAYERS = 6;
export const CUTPATTI_TOTAL_CARDS_52 = 52;
export const CUTPATTI_MIN_BID = 1;

export const CUTPATTI_ROOM_CODE_LENGTH = 6;
export const CUTPATTI_MIN_PLAYER_NAME_LENGTH = 2;
export const CUTPATTI_MAX_PLAYER_NAME_LENGTH = 16;
export const CUTPATTI_SESSION_TOKEN_LENGTH = 32;

/**
 * Deterministic card distribution config based on player count (3–6 players).
 */
export interface CutpattiDistributionPlan {
  playerCount: number;
  cardsPerPlayer: number;
  cardsUsed: number;
  cardsRemoved: number;
  removedCardIds: string[]; // Deterministic list of cards excluded from play
}

/**
 * Deterministic policy for card exclusion:
 * - 3 players: 16 cards each -> 48 cards used, 4 removed (all 4 2s: 2_hearts, 2_spades, 2_diamonds, 2_clubs)
 * - 4 players: 13 cards each -> 52 cards used, 0 removed
 * - 5 players: 10 cards each -> 50 cards used, 2 removed (2_hearts, 2_spades)
 * - 6 players: 8 cards each -> 48 cards used, 4 removed (all 4 2s: 2_hearts, 2_spades, 2_diamonds, 2_clubs)
 */
export function getDistributionPlan(playerCount: number): CutpattiDistributionPlan {
  if (playerCount < CUTPATTI_MIN_PLAYERS || playerCount > CUTPATTI_MAX_PLAYERS) {
    throw new Error(`Cutpatti requires between ${CUTPATTI_MIN_PLAYERS} and ${CUTPATTI_MAX_PLAYERS} players. Received: ${playerCount}`);
  }

  const CARDS_PER_PLAYER_MAP: Record<number, number> = {
    3: 16,
    4: 13,
    5: 10,
    6: 8,
  };

  const cardsPerPlayer = CARDS_PER_PLAYER_MAP[playerCount];
  const cardsUsed = cardsPerPlayer * playerCount;
  const cardsRemoved = CUTPATTI_TOTAL_CARDS_52 - cardsUsed;

  let removedCardIds: string[] = [];
  if (cardsRemoved === 4) {
    removedCardIds = ['2_hearts', '2_spades', '2_diamonds', '2_clubs'];
  } else if (cardsRemoved === 2) {
    removedCardIds = ['2_hearts', '2_spades'];
  }

  return {
    playerCount,
    cardsPerPlayer,
    cardsUsed,
    cardsRemoved,
    removedCardIds,
  };
}

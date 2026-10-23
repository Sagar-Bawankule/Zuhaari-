// ─── Suits ───────────────────────────────────────────────
export enum Suit {
  Spades = 'spades',
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Spades]: '♠',
  [Suit.Hearts]: '♥',
  [Suit.Diamonds]: '♦',
  [Suit.Clubs]: '♣',
};

export const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
  [Suit.Spades]: 'black',
  [Suit.Hearts]: 'red',
  [Suit.Diamonds]: 'red',
  [Suit.Clubs]: 'black',
};

// ─── Ranks ───────────────────────────────────────────────
export enum Rank {
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

/** Rank strength in ascending order. Higher number = stronger card. */
export const RANK_STRENGTH: Record<Rank, number> = {
  [Rank.Six]: 1,
  [Rank.Seven]: 2,
  [Rank.Eight]: 3,
  [Rank.Nine]: 4,
  [Rank.Ten]: 5,
  [Rank.Jack]: 6,
  [Rank.Queen]: 7,
  [Rank.King]: 8,
  [Rank.Ace]: 9,
};

export const ALL_RANKS: Rank[] = [
  Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
  Rank.Jack, Rank.Queen, Rank.King, Rank.Ace,
];

export const ALL_SUITS: Suit[] = [
  Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs,
];

// ─── Cards ───────────────────────────────────────────────
export interface Card {
  id: string;       // e.g. "6_spades"
  rank: Rank;
  suit: Suit;
  strength: number; // numeric from RANK_STRENGTH
}

/** A card with hidden identity (for opponents' hands) */
export interface HiddenCard {
  hidden: true;
}

// ─── Teams ───────────────────────────────────────────────
export enum TeamId {
  TeamAC = 'team_ac',
  TeamBD = 'team_bd',
}

export const TEAM_NAMES: Record<TeamId, string> = {
  [TeamId.TeamAC]: 'Team AC',
  [TeamId.TeamBD]: 'Team BD',
};

// ─── Player Seats ────────────────────────────────────────
export type SeatIndex = 0 | 1 | 2 | 3;

/** Seat 0 = Player A, Seat 1 = Player B, Seat 2 = Player C, Seat 3 = Player D */
export const SEAT_LABELS: Record<SeatIndex, string> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D',
};

/** Fixed team assignment by seat: A+C = TeamAC, B+D = TeamBD */
export const SEAT_TEAM: Record<SeatIndex, TeamId> = {
  0: TeamId.TeamAC,
  1: TeamId.TeamBD,
  2: TeamId.TeamAC,
  3: TeamId.TeamBD,
};

// ─── Game Constants ──────────────────────────────────────
export const TOTAL_CARDS = 36;
export const CARDS_PER_PLAYER = 9;
export const FIRST_DEAL_COUNT = 5;
export const SECOND_DEAL_COUNT = 4;
export const TOTAL_HANDS = 9;
export const PLAYERS_PER_GAME = 4;
export const DEFAULT_CUTT_TARGET = 5;
export const DECLARED_CUTT_TARGET = 6;

// ─── Room Constants ──────────────────────────────────────
export const ROOM_CODE_LENGTH = 6;
export const MAX_PLAYERS_PER_ROOM = 4;
export const MIN_PLAYER_NAME_LENGTH = 2;
export const MAX_PLAYER_NAME_LENGTH = 16;
export const SESSION_TOKEN_LENGTH = 32;

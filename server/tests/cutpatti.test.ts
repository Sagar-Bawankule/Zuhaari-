import { describe, it, expect, beforeEach } from 'vitest';
import {
  CutpattiRank,
  CutpattiSuit,
  CUTPATTI_ALL_SUITS,
  getDistributionPlan,
  CutpattiCard,
} from '@shared/cutpatti/constants';
import { create52CardDeck, shuffleCutpattiDeck } from '../src/cutpatti/deck';
import { prepareDeckForPlayers, dealCutpattiHands } from '../src/cutpatti/distribution';
import { selectRandomTrump } from '../src/cutpatti/trump';
import { validateBid, areAllBidsSubmitted } from '../src/cutpatti/bidding';
import { getLegalCards, isCardLegal } from '../src/cutpatti/rules';
import { resolveCutpattiTrick } from '../src/cutpatti/trickResolver';
import {
  calculatePlayerScore,
  calculateRoundScores,
  updateCumulativeScores,
  buildLeaderboard,
} from '../src/cutpatti/scoring';
import { CutpattiGameEngine } from '../src/cutpatti/gameEngine';
import { CutpattiRoomManager } from '../src/cutpatti/roomManager';
import { CutpattiPhase, CutpattiPlayedCard, CutpattiPlayer } from '@shared/cutpatti/types';

describe('Cutpatti Deck & Distribution', () => {
  it('creates a standard 52-card deck with correct ranks and suits', () => {
    const deck = create52CardDeck();
    expect(deck.length).toBe(52);

    const suits = new Set(deck.map((c) => c.suit));
    expect(suits.size).toBe(4);

    const ranks = new Set(deck.map((c) => c.rank));
    expect(ranks.size).toBe(13);

    // No duplicate card IDs
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(52);
  });

  it('calculates distribution plan correctly for 3, 4, 5, 6 players', () => {
    // 3 players: 16 each, 48 used, 4 removed
    const plan3 = getDistributionPlan(3);
    expect(plan3.cardsPerPlayer).toBe(16);
    expect(plan3.cardsUsed).toBe(48);
    expect(plan3.cardsRemoved).toBe(4);
    expect(plan3.removedCardIds.length).toBe(4);

    // 4 players: 13 each, 52 used, 0 removed
    const plan4 = getDistributionPlan(4);
    expect(plan4.cardsPerPlayer).toBe(13);
    expect(plan4.cardsUsed).toBe(52);
    expect(plan4.cardsRemoved).toBe(0);
    expect(plan4.removedCardIds.length).toBe(0);

    // 5 players: 10 each, 50 used, 2 removed
    const plan5 = getDistributionPlan(5);
    expect(plan5.cardsPerPlayer).toBe(10);
    expect(plan5.cardsUsed).toBe(50);
    expect(plan5.cardsRemoved).toBe(2);
    expect(plan5.removedCardIds.length).toBe(2);

    // 6 players: 8 each, 48 used, 4 removed
    const plan6 = getDistributionPlan(6);
    expect(plan6.cardsPerPlayer).toBe(8);
    expect(plan6.cardsUsed).toBe(48);
    expect(plan6.cardsRemoved).toBe(4);
    expect(plan6.removedCardIds.length).toBe(4);
  });

  it('throws on unsupported player counts (e.g. 2 or 7)', () => {
    expect(() => getDistributionPlan(2)).toThrow();
    expect(() => getDistributionPlan(7)).toThrow();
  });

  it('excludes lowest ranking cards (2s) deterministically', () => {
    const prep3 = prepareDeckForPlayers(3);
    expect(prep3.deck.length).toBe(48);
    expect(prep3.excludedCards.length).toBe(4);
    expect(prep3.excludedCards.every((c) => c.rank === CutpattiRank.Two)).toBe(true);

    const prep5 = prepareDeckForPlayers(5);
    expect(prep5.deck.length).toBe(50);
    expect(prep5.excludedCards.length).toBe(2);
    expect(prep5.excludedCards.every((c) => c.rank === CutpattiRank.Two)).toBe(true);
    // Verified 2 removed 2s are from different suits
    expect(prep5.excludedCards[0].suit).not.toBe(prep5.excludedCards[1].suit);

    const prep6 = prepareDeckForPlayers(6);
    expect(prep6.deck.length).toBe(48);
    expect(prep6.excludedCards.length).toBe(4);
    expect(prep6.excludedCards.every((c) => c.rank === CutpattiRank.Two)).toBe(true);
  });

  it('deals equal hands without duplicates to all players', () => {
    for (const count of [3, 4, 5, 6]) {
      const { deck, cardsPerPlayer } = prepareDeckForPlayers(count);
      const { hands } = dealCutpattiHands(deck, count, cardsPerPlayer);

      expect(hands.length).toBe(count);
      const allDealtCardIds = new Set<string>();

      for (const hand of hands) {
        expect(hand.length).toBe(cardsPerPlayer);
        for (const card of hand) {
          expect(allDealtCardIds.has(card.id)).toBe(false);
          allDealtCardIds.add(card.id);
        }
      }
      expect(allDealtCardIds.size).toBe(count * cardsPerPlayer);
    }
  });
});

describe('Cutpatti Trump Selection', () => {
  it('selects valid trump suits and covers all suits across runs', () => {
    const selectedSuits = new Set<CutpattiSuit>();
    for (let i = 0; i < 100; i++) {
      const trump = selectRandomTrump();
      expect(CUTPATTI_ALL_SUITS.includes(trump)).toBe(true);
      selectedSuits.add(trump);
    }
    // With 100 trials, all 4 suits will be picked with >99.999% probability
    expect(selectedSuits.size).toBe(4);
  });
});

describe('Cutpatti Bidding Rules', () => {
  it('validates bids according to available tricks and minimums', () => {
    const cardsPerPlayer = 10;

    expect(validateBid(0, cardsPerPlayer).valid).toBe(false);
    expect(validateBid(-1, cardsPerPlayer).valid).toBe(false);
    expect(validateBid(1.5, cardsPerPlayer).valid).toBe(false);
    expect(validateBid(11, cardsPerPlayer).valid).toBe(false);

    expect(validateBid(1, cardsPerPlayer).valid).toBe(true);
    expect(validateBid(5, cardsPerPlayer).valid).toBe(true);
    expect(validateBid(10, cardsPerPlayer).valid).toBe(true);
  });

  it('checks if all bids have been submitted', () => {
    const playerIds = ['p1', 'p2', 'p3'];
    expect(areAllBidsSubmitted({ p1: 2, p2: 3 }, playerIds)).toBe(false);
    expect(areAllBidsSubmitted({ p1: 2, p2: 3, p3: 1 }, playerIds)).toBe(true);
  });
});

describe('Cutpatti Playing Rules (Follow Suit & Legality)', () => {
  const hand: CutpattiCard[] = [
    { id: '10_spades', rank: CutpattiRank.Ten, suit: CutpattiSuit.Spades, strength: 9 },
    { id: 'A_spades', rank: CutpattiRank.Ace, suit: CutpattiSuit.Spades, strength: 13 },
    { id: 'K_hearts', rank: CutpattiRank.King, suit: CutpattiSuit.Hearts, strength: 12 },
    { id: '7_diamonds', rank: CutpattiRank.Seven, suit: CutpattiSuit.Diamonds, strength: 6 },
  ];

  it('allows any card when leading (leadSuit is null)', () => {
    const legal = getLegalCards(hand, null);
    expect(legal.length).toBe(hand.length);
  });

  it('restricts play to lead suit if player holds cards of that suit', () => {
    const legalSpades = getLegalCards(hand, CutpattiSuit.Spades);
    expect(legalSpades.length).toBe(2);
    expect(legalSpades.every((c) => c.suit === CutpattiSuit.Spades)).toBe(true);

    expect(isCardLegal('A_spades', hand, CutpattiSuit.Spades)).toBe(true);
    expect(isCardLegal('K_hearts', hand, CutpattiSuit.Spades)).toBe(false);
  });

  it('allows playing any card when void in lead suit', () => {
    // Void in clubs
    const legalClubs = getLegalCards(hand, CutpattiSuit.Clubs);
    expect(legalClubs.length).toBe(hand.length);

    expect(isCardLegal('K_hearts', hand, CutpattiSuit.Clubs)).toBe(true);
    expect(isCardLegal('7_diamonds', hand, CutpattiSuit.Clubs)).toBe(true);
  });
});

describe('Cutpatti Trick Resolution', () => {
  const trump = CutpattiSuit.Spades;

  it('awards trick to highest card of lead suit when no trump played', () => {
    const playedCards: CutpattiPlayedCard[] = [
      {
        playerId: 'p1',
        seatIndex: 0,
        playerName: 'Alice',
        card: { id: '9_hearts', rank: CutpattiRank.Nine, suit: CutpattiSuit.Hearts, strength: 8 },
      },
      {
        playerId: 'p2',
        seatIndex: 1,
        playerName: 'Bob',
        card: { id: 'K_hearts', rank: CutpattiRank.King, suit: CutpattiSuit.Hearts, strength: 12 },
      },
      {
        playerId: 'p3',
        seatIndex: 2,
        playerName: 'Charlie',
        card: { id: '7_diamonds', rank: CutpattiRank.Seven, suit: CutpattiSuit.Diamonds, strength: 6 },
      },
    ];

    const result = resolveCutpattiTrick(playedCards, trump);
    expect(result.winner.playerId).toBe('p2');
    expect(result.winningCard.id).toBe('K_hearts');
  });

  it('awards trick to trump card over higher non-trump cards', () => {
    const playedCards: CutpattiPlayedCard[] = [
      {
        playerId: 'p1',
        seatIndex: 0,
        playerName: 'Alice',
        card: { id: 'A_hearts', rank: CutpattiRank.Ace, suit: CutpattiSuit.Hearts, strength: 13 },
      },
      {
        playerId: 'p2',
        seatIndex: 1,
        playerName: 'Bob',
        card: { id: '3_spades', rank: CutpattiRank.Three, suit: CutpattiSuit.Spades, strength: 2 }, // trump
      },
      {
        playerId: 'p3',
        seatIndex: 2,
        playerName: 'Charlie',
        card: { id: 'K_hearts', rank: CutpattiRank.King, suit: CutpattiSuit.Hearts, strength: 12 },
      },
    ];

    const result = resolveCutpattiTrick(playedCards, trump);
    expect(result.winner.playerId).toBe('p2');
    expect(result.winningCard.id).toBe('3_spades');
  });

  it('awards trick to highest trump when multiple trumps are played', () => {
    const playedCards: CutpattiPlayedCard[] = [
      {
        playerId: 'p1',
        seatIndex: 0,
        playerName: 'Alice',
        card: { id: '10_clubs', rank: CutpattiRank.Ten, suit: CutpattiSuit.Clubs, strength: 9 },
      },
      {
        playerId: 'p2',
        seatIndex: 1,
        playerName: 'Bob',
        card: { id: '5_spades', rank: CutpattiRank.Five, suit: CutpattiSuit.Spades, strength: 4 }, // trump
      },
      {
        playerId: 'p3',
        seatIndex: 2,
        playerName: 'Charlie',
        card: { id: 'J_spades', rank: CutpattiRank.Jack, suit: CutpattiSuit.Spades, strength: 10 }, // higher trump
      },
    ];

    const result = resolveCutpattiTrick(playedCards, trump);
    expect(result.winner.playerId).toBe('p3');
    expect(result.winningCard.id).toBe('J_spades');
  });
});

describe('Cutpatti Scoring System', () => {
  it('scores exact bids correctly', () => {
    // Bid 3, win 3 -> +3.0
    expect(calculatePlayerScore(3, 3)).toBe(3.0);
    // Bid 1, win 1 -> +1.0
    expect(calculatePlayerScore(1, 1)).toBe(1.0);
  });

  it('scores overtricks correctly with +0.1 per extra trick', () => {
    // Bid 3, win 4 -> +3.1
    expect(calculatePlayerScore(3, 4)).toBe(3.1);
    // Bid 3, win 5 -> +3.2
    expect(calculatePlayerScore(3, 5)).toBe(3.2);
  });

  it('scores undertricks (missed bids) with negative penalty (-bid)', () => {
    // Bid 4, win 2 -> -4.0
    expect(calculatePlayerScore(4, 2)).toBe(-4.0);
    // Bid 5, win 0 -> -5.0
    expect(calculatePlayerScore(5, 0)).toBe(-5.0);
  });

  it('handles floating point precision safely', () => {
    // Bid 2, win 5 -> 2 + 3 * 0.1 = 2.3
    expect(calculatePlayerScore(2, 5)).toBe(2.3);
  });

  it('updates cumulative scores across multiple rounds', () => {
    const prevTotals = { p1: 3.1, p2: -4.0, p3: 2.0 };
    const roundScores = { p1: 2.1, p2: 1.0, p3: -2.0 };
    const newTotals = updateCumulativeScores(prevTotals, roundScores, ['p1', 'p2', 'p3']);

    expect(newTotals.p1).toBe(5.2);
    expect(newTotals.p2).toBe(-3.0);
    expect(newTotals.p3).toBe(0.0);
  });

  it('builds ranked leaderboard sorted descending', () => {
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
      { id: 'p3', name: 'Charlie' },
    ];
    const totals = { p1: 5.2, p2: 8.5, p3: 5.2 };
    const board = buildLeaderboard(players, totals);

    expect(board[0].name).toBe('Bob');
    expect(board[0].rank).toBe(1);
    expect(board[1].name).toBe('Alice');
    expect(board[1].rank).toBe(2);
    expect(board[2].name).toBe('Charlie');
    expect(board[2].rank).toBe(2); // tied rank
  });
});

describe('Cutpatti Room Manager', () => {
  let rm: CutpattiRoomManager;

  beforeEach(() => {
    rm = new CutpattiRoomManager();
  });

  it('creates and joins rooms with valid players', () => {
    const { room, sessionToken } = rm.createRoom('HostPlayer', 's1');
    expect(room.players.length).toBe(1);
    expect(room.hostId).toBe('s1');
    expect(sessionToken).toBeDefined();

    const joinRes = rm.joinRoom(room.code, 'Player2', 's2');
    expect(joinRes.room.players.length).toBe(2);
    expect(joinRes.room.players[1].name).toBe('Player2');
  });

  it('prevents starting with fewer than 3 players', () => {
    const { room } = rm.createRoom('HostPlayer', 's1');
    rm.joinRoom(room.code, 'Player2', 's2');

    expect(() => rm.startGame('s1')).toThrow(/at least 3 players/);
  });

  it('prevents starting if any player is unready', () => {
    const { room } = rm.createRoom('HostPlayer', 's1');
    rm.joinRoom(room.code, 'Player2', 's2');
    rm.joinRoom(room.code, 'Player3', 's3');

    // Player 2 & 3 are not ready
    expect(() => rm.startGame('s1')).toThrow(/not ready/);

    rm.toggleReady('s2');
    rm.toggleReady('s3');

    const started = rm.startGame('s1');
    expect(started.room.status).toBe('in_game');
    expect(started.engine).toBeDefined();
  });

  it('enforces room max capacity of 6 players', () => {
    const { room } = rm.createRoom('P1', 's1');
    rm.joinRoom(room.code, 'P2', 's2');
    rm.joinRoom(room.code, 'P3', 's3');
    rm.joinRoom(room.code, 'P4', 's4');
    rm.joinRoom(room.code, 'P5', 's5');
    rm.joinRoom(room.code, 'P6', 's6');

    expect(() => rm.joinRoom(room.code, 'P7', 's7')).toThrow(/Room is full/);
  });
});

describe('Cutpatti End-to-End Game Flow Simulation', () => {
  it('runs a complete 3-player game through bidding, tricks, and scoring', () => {
    const players: CutpattiPlayer[] = [
      { id: 'p1', name: 'P1', seatIndex: 0, isReady: true, isConnected: true, sessionToken: 't1', isHost: true },
      { id: 'p2', name: 'P2', seatIndex: 1, isReady: true, isConnected: true, sessionToken: 't2', isHost: false },
      { id: 'p3', name: 'P3', seatIndex: 2, isReady: true, isConnected: true, sessionToken: 't3', isHost: false },
    ];

    const engine = new CutpattiGameEngine(players);
    expect(engine.state.phase).toBe(CutpattiPhase.Bidding);
    expect(engine.state.cardsPerPlayer).toBe(16);
    expect(engine.state.totalTricks).toBe(16);

    // Player hand confidentiality: client state hides opponents' cards
    const clientStateP1 = engine.getClientState('p1');
    expect(clientStateP1.myHand.length).toBe(16);
    expect(clientStateP1.opponentCardCounts['p2']).toBe(16);
    expect((clientStateP1 as any).playerHands).toBeUndefined();

    // Bidding phase
    engine.submitBid('p1', 4);
    engine.submitBid('p2', 5);
    const bidResult = engine.submitBid('p3', 6);
    expect(bidResult.allBidsDone).toBe(true);
    expect(engine.state.phase).toBe(CutpattiPhase.Playing);

    // Play all 16 tricks
    for (let trick = 0; trick < 16; trick++) {
      for (let step = 0; step < 3; step++) {
        const turnSeat = engine.state.currentTurnSeat;
        const currentP = players.find((p) => p.seatIndex === turnSeat)!;
        const hand = engine.state.playerHands.get(currentP.id)!;
        const legalCards = getLegalCards(hand, engine.state.leadSuit);
        const cardToPlay = legalCards[0];

        const playRes = engine.playCard(currentP.id, cardToPlay.id);
        expect(playRes.success).toBe(true);
      }
    }

    expect(engine.state.phase).toBe(CutpattiPhase.RoundComplete);
    expect(engine.state.completedTricks.length).toBe(16);

    const roundRes = engine.getRoundResult();
    expect(roundRes.playerResults.length).toBe(3);
    const sumTricksWon = roundRes.playerResults.reduce((sum, p) => sum + p.tricksWon, 0);
    expect(sumTricksWon).toBe(16);
  });
});

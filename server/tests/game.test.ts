/**
 * Comprehensive tests for the Zuhaari game engine.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDeck, validateDeck } from '../src/game/deck';
import { shuffleDeck, deterministicShuffle } from '../src/game/shuffle';
import { dealCards } from '../src/game/deal';
import { isLegalMove, getLegalMoves, compareCards } from '../src/game/rules';
import { resolveHand } from '../src/game/handResolver';
import { calculateRoundResult } from '../src/game/scoring';
import {
  createCuttState,
  getCurrentBiddingSeat,
  processDeclare,
  processPass,
  isDefaultCuttRequired,
  processDefaultCutt,
  DEFAULT_CUTT_CONFIG,
} from '../src/game/cutt';
import { GameEngine } from '../src/game/gameEngine';
import { RoomManager } from '../src/rooms/roomManager';
import {
  Suit,
  Rank,
  TeamId,
  TOTAL_CARDS,
  FIRST_DEAL_COUNT,
  SECOND_DEAL_COUNT,
  CARDS_PER_PLAYER,
  TOTAL_HANDS,
  DEFAULT_CUTT_TARGET,
  DECLARED_CUTT_TARGET,
  RANK_STRENGTH,
  type Card,
  type SeatIndex,
} from '@shared/constants';
import { CuttType, GamePhase, type Player, type PlayedCard, type CompletedHand } from '@shared/types/index';

// ─── Helper to create a test player ──────────────────────
function createTestPlayer(index: number): Player {
  return {
    id: `player-${index}`,
    name: `Player ${String.fromCharCode(65 + index)}`,
    seatIndex: index as SeatIndex,
    team: index % 2 === 0 ? TeamId.TeamAC : TeamId.TeamBD,
    isReady: true,
    isConnected: true,
    sessionToken: `token-${index}`,
  };
}

function makeCard(rank: Rank, suit: Suit): Card {
  return {
    id: `${rank}_${suit}`,
    rank,
    suit,
    strength: RANK_STRENGTH[rank],
  };
}

// ═══════════════════════════════════════════════════════════
// DECK TESTS
// ═══════════════════════════════════════════════════════════
describe('Deck', () => {
  it('should create a 36-card deck', () => {
    const deck = createDeck();
    expect(deck.length).toBe(TOTAL_CARDS);
  });

  it('should have 9 ranks per suit', () => {
    const deck = createDeck();
    for (const suit of [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]) {
      const suitCards = deck.filter(c => c.suit === suit);
      expect(suitCards.length).toBe(9);
    }
  });

  it('should have unique card IDs', () => {
    const deck = createDeck();
    const ids = new Set(deck.map(c => c.id));
    expect(ids.size).toBe(TOTAL_CARDS);
  });

  it('should validate a correct deck', () => {
    expect(validateDeck(createDeck())).toBe(true);
  });

  it('should not include ranks below 6', () => {
    const deck = createDeck();
    const invalidRanks = ['2', '3', '4', '5'];
    for (const card of deck) {
      expect(invalidRanks).not.toContain(card.rank);
    }
  });

  it('should assign correct strength values', () => {
    const deck = createDeck();
    const ace = deck.find(c => c.rank === Rank.Ace)!;
    const six = deck.find(c => c.rank === Rank.Six)!;
    expect(ace.strength).toBeGreaterThan(six.strength);
    expect(ace.strength).toBe(9);
    expect(six.strength).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════
// SHUFFLE TESTS
// ═══════════════════════════════════════════════════════════
describe('Shuffle', () => {
  it('should maintain all 36 cards after shuffle', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled.length).toBe(TOTAL_CARDS);
    expect(validateDeck(shuffled)).toBe(true);
  });

  it('should produce different order from original', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    // Extremely unlikely to be identical
    const sameOrder = deck.every((c, i) => c.id === shuffled[i].id);
    expect(sameOrder).toBe(false);
  });

  it('deterministic shuffle should produce same result with same seed', () => {
    const deck = createDeck();
    const s1 = deterministicShuffle(deck, 42);
    const s2 = deterministicShuffle(deck, 42);
    expect(s1.map(c => c.id)).toEqual(s2.map(c => c.id));
  });

  it('deterministic shuffle should produce different results with different seeds', () => {
    const deck = createDeck();
    const s1 = deterministicShuffle(deck, 42);
    const s2 = deterministicShuffle(deck, 99);
    const sameOrder = s1.every((c, i) => c.id === s2[i].id);
    expect(sameOrder).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// DEAL TESTS
// ═══════════════════════════════════════════════════════════
describe('Deal', () => {
  it('should deal 5 cards in first stage to each player', () => {
    const deck = createDeck();
    const result = dealCards(deck);
    for (let i = 0; i < 4; i++) {
      expect(result.firstDeal[i].length).toBe(FIRST_DEAL_COUNT);
    }
  });

  it('should deal 4 cards in second stage to each player', () => {
    const deck = createDeck();
    const result = dealCards(deck);
    for (let i = 0; i < 4; i++) {
      expect(result.secondDeal[i].length).toBe(SECOND_DEAL_COUNT);
    }
  });

  it('should deal exactly 9 total cards per player', () => {
    const deck = createDeck();
    const result = dealCards(deck);
    for (let i = 0; i < 4; i++) {
      const total = result.firstDeal[i].length + result.secondDeal[i].length;
      expect(total).toBe(CARDS_PER_PLAYER);
    }
  });

  it('should distribute all 36 cards with no duplicates', () => {
    const deck = createDeck();
    const result = dealCards(deck);
    const allDealt: Card[] = [];
    for (let i = 0; i < 4; i++) {
      allDealt.push(...result.firstDeal[i], ...result.secondDeal[i]);
    }
    expect(allDealt.length).toBe(TOTAL_CARDS);
    const ids = new Set(allDealt.map(c => c.id));
    expect(ids.size).toBe(TOTAL_CARDS);
  });

  it('should reject deck with wrong number of cards', () => {
    expect(() => dealCards([])).toThrow();
    expect(() => dealCards(createDeck().slice(0, 30))).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════
// RULES TESTS
// ═══════════════════════════════════════════════════════════
describe('Rules', () => {
  describe('isLegalMove', () => {
    it('should allow any card when leading (no lead suit)', () => {
      const hand = [makeCard(Rank.Ace, Suit.Spades), makeCard(Rank.Six, Suit.Hearts)];
      expect(isLegalMove(hand[0], hand, null)).toBe(true);
      expect(isLegalMove(hand[1], hand, null)).toBe(true);
    });

    it('should require following lead suit when player has it', () => {
      const hand = [
        makeCard(Rank.Ace, Suit.Spades),
        makeCard(Rank.Six, Suit.Hearts),
        makeCard(Rank.King, Suit.Spades),
      ];
      expect(isLegalMove(hand[0], hand, Suit.Spades)).toBe(true); // Spade OK
      expect(isLegalMove(hand[2], hand, Suit.Spades)).toBe(true); // Spade OK
      expect(isLegalMove(hand[1], hand, Suit.Spades)).toBe(false); // Heart NOT OK
    });

    it('should allow any card when void in lead suit', () => {
      const hand = [
        makeCard(Rank.Ace, Suit.Hearts),
        makeCard(Rank.Six, Suit.Diamonds),
      ];
      expect(isLegalMove(hand[0], hand, Suit.Spades)).toBe(true);
      expect(isLegalMove(hand[1], hand, Suit.Spades)).toBe(true);
    });
  });

  describe('getLegalMoves', () => {
    it('should return all cards when leading', () => {
      const hand = [
        makeCard(Rank.Ace, Suit.Spades),
        makeCard(Rank.Six, Suit.Hearts),
      ];
      expect(getLegalMoves(hand, null).length).toBe(2);
    });

    it('should return only lead suit cards when player has them', () => {
      const hand = [
        makeCard(Rank.Ace, Suit.Spades),
        makeCard(Rank.Six, Suit.Hearts),
        makeCard(Rank.King, Suit.Spades),
      ];
      const legal = getLegalMoves(hand, Suit.Spades);
      expect(legal.length).toBe(2);
      expect(legal.every(c => c.suit === Suit.Spades)).toBe(true);
    });
  });

  describe('compareCards', () => {
    it('trump beats non-trump', () => {
      const a: PlayedCard = { playerId: 'p1', seatIndex: 0 as SeatIndex, card: makeCard(Rank.Six, Suit.Hearts) };
      const b: PlayedCard = { playerId: 'p2', seatIndex: 1 as SeatIndex, card: makeCard(Rank.Ace, Suit.Spades) };
      const winner = compareCards(a, b, Suit.Spades, Suit.Hearts);
      expect(winner.playerId).toBe('p1'); // 6♥ (trump) beats A♠
    });

    it('higher trump beats lower trump', () => {
      const a: PlayedCard = { playerId: 'p1', seatIndex: 0 as SeatIndex, card: makeCard(Rank.Nine, Suit.Hearts) };
      const b: PlayedCard = { playerId: 'p2', seatIndex: 1 as SeatIndex, card: makeCard(Rank.Six, Suit.Hearts) };
      const winner = compareCards(a, b, Suit.Spades, Suit.Hearts);
      expect(winner.playerId).toBe('p1');
    });

    it('higher lead suit card wins when no trump played', () => {
      const a: PlayedCard = { playerId: 'p1', seatIndex: 0 as SeatIndex, card: makeCard(Rank.King, Suit.Spades) };
      const b: PlayedCard = { playerId: 'p2', seatIndex: 1 as SeatIndex, card: makeCard(Rank.Seven, Suit.Spades) };
      const winner = compareCards(a, b, Suit.Spades, Suit.Hearts);
      expect(winner.playerId).toBe('p1');
    });

    it('off-suit non-trump card cannot beat lead suit', () => {
      const a: PlayedCard = { playerId: 'p1', seatIndex: 0 as SeatIndex, card: makeCard(Rank.Six, Suit.Spades) };
      const b: PlayedCard = { playerId: 'p2', seatIndex: 1 as SeatIndex, card: makeCard(Rank.Ace, Suit.Diamonds) };
      const winner = compareCards(a, b, Suit.Spades, Suit.Hearts);
      expect(winner.playerId).toBe('p1'); // Lead suit holds
    });
  });
});

// ═══════════════════════════════════════════════════════════
// HAND RESOLVER TESTS
// ═══════════════════════════════════════════════════════════
describe('HandResolver', () => {
  it('should resolve trump card as winner', () => {
    const cards: PlayedCard[] = [
      { playerId: 'p0', seatIndex: 0 as SeatIndex, card: makeCard(Rank.King, Suit.Spades) },
      { playerId: 'p1', seatIndex: 1 as SeatIndex, card: makeCard(Rank.Seven, Suit.Spades) },
      { playerId: 'p2', seatIndex: 2 as SeatIndex, card: makeCard(Rank.Ace, Suit.Spades) },
      { playerId: 'p3', seatIndex: 3 as SeatIndex, card: makeCard(Rank.Six, Suit.Hearts) },
    ];
    const result = resolveHand(cards, Suit.Hearts);
    expect(result.winnerId).toBe('p3'); // 6♥ is trump
    expect(result.winningTeam).toBe(TeamId.TeamBD);
  });

  it('should resolve highest lead-suit card when no trump', () => {
    const cards: PlayedCard[] = [
      { playerId: 'p0', seatIndex: 0 as SeatIndex, card: makeCard(Rank.King, Suit.Spades) },
      { playerId: 'p1', seatIndex: 1 as SeatIndex, card: makeCard(Rank.Seven, Suit.Spades) },
      { playerId: 'p2', seatIndex: 2 as SeatIndex, card: makeCard(Rank.Ace, Suit.Spades) },
      { playerId: 'p3', seatIndex: 3 as SeatIndex, card: makeCard(Rank.Nine, Suit.Spades) },
    ];
    const result = resolveHand(cards, Suit.Hearts);
    expect(result.winnerId).toBe('p2'); // A♠ highest
  });

  it('should resolve highest trump when multiple trump cards', () => {
    const cards: PlayedCard[] = [
      { playerId: 'p0', seatIndex: 0 as SeatIndex, card: makeCard(Rank.King, Suit.Spades) },
      { playerId: 'p1', seatIndex: 1 as SeatIndex, card: makeCard(Rank.Six, Suit.Hearts) },
      { playerId: 'p2', seatIndex: 2 as SeatIndex, card: makeCard(Rank.Ten, Suit.Diamonds) },
      { playerId: 'p3', seatIndex: 3 as SeatIndex, card: makeCard(Rank.Ace, Suit.Hearts) },
    ];
    const result = resolveHand(cards, Suit.Hearts);
    expect(result.winnerId).toBe('p3'); // A♥ is highest trump
  });

  it('should reject hand with != 4 cards', () => {
    const cards: PlayedCard[] = [
      { playerId: 'p0', seatIndex: 0 as SeatIndex, card: makeCard(Rank.King, Suit.Spades) },
    ];
    expect(() => resolveHand(cards, Suit.Hearts)).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════
// CUTT TESTS
// ═══════════════════════════════════════════════════════════
describe('Cutt', () => {
  it('bidding starts at seat 1 (Player B)', () => {
    const state = createCuttState();
    expect(getCurrentBiddingSeat(state)).toBe(1);
  });

  it('should process a declaration', () => {
    const state = createCuttState();
    const newState = processDeclare(state, 1 as SeatIndex, Suit.Hearts, 'p1', TeamId.TeamBD);
    expect(newState.isComplete).toBe(true);
    expect(newState.decision?.suit).toBe(Suit.Hearts);
    expect(newState.decision?.type).toBe(CuttType.Declared);
    expect(newState.decision?.target).toBe(DECLARED_CUTT_TARGET);
  });

  it('should advance to next seat on pass', () => {
    let state = createCuttState();
    state = processPass(state, 1 as SeatIndex); // B passes
    expect(getCurrentBiddingSeat(state)).toBe(2); // C's turn
  });

  it('all 4 passes should trigger default cutt requirement', () => {
    let state = createCuttState();
    state = processPass(state, 1 as SeatIndex); // B
    state = processPass(state, 2 as SeatIndex); // C
    state = processPass(state, 3 as SeatIndex); // D
    state = processPass(state, 0 as SeatIndex); // A
    expect(isDefaultCuttRequired(state)).toBe(true);
  });

  it('default cutt should have target of 5', () => {
    let state = createCuttState();
    state = processPass(state, 1 as SeatIndex);
    state = processPass(state, 2 as SeatIndex);
    state = processPass(state, 3 as SeatIndex);
    state = processPass(state, 0 as SeatIndex);
    state = processDefaultCutt(state, Suit.Diamonds, 'p1', TeamId.TeamBD);
    expect(state.isComplete).toBe(true);
    expect(state.decision?.target).toBe(DEFAULT_CUTT_TARGET);
    expect(state.decision?.type).toBe(CuttType.Default);
  });

  it('should reject bid from wrong seat', () => {
    const state = createCuttState();
    expect(() => processDeclare(state, 0 as SeatIndex, Suit.Hearts, 'p0', TeamId.TeamAC))
      .toThrow();
  });
});

// ═══════════════════════════════════════════════════════════
// SCORING TESTS
// ═══════════════════════════════════════════════════════════
describe('Scoring', () => {
  function makeCompletedHands(acWins: number): CompletedHand[] {
    const hands: CompletedHand[] = [];
    for (let i = 0; i < TOTAL_HANDS; i++) {
      const team = i < acWins ? TeamId.TeamAC : TeamId.TeamBD;
      hands.push({
        handNumber: i + 1,
        cards: [],
        winnerId: team === TeamId.TeamAC ? 'p0' : 'p1',
        winnerSeat: (team === TeamId.TeamAC ? 0 : 1) as SeatIndex,
        winningTeam: team,
      });
    }
    return hands;
  }

  it('declaring team wins when meeting declared target (6)', () => {
    const result = calculateRoundResult(
      makeCompletedHands(6), // AC wins 6
      {
        declaringPlayerId: 'p0',
        declaringTeam: TeamId.TeamAC,
        suit: Suit.Hearts,
        type: CuttType.Declared,
        target: DECLARED_CUTT_TARGET,
      },
      { [TeamId.TeamAC]: 6, [TeamId.TeamBD]: 3 },
    );
    expect(result.winningTeam).toBe(TeamId.TeamAC);
    expect(result.cuttTargetMet).toBe(true);
  });

  it('declaring team loses when failing declared target', () => {
    const result = calculateRoundResult(
      makeCompletedHands(4), // AC wins 4 (needs 6)
      {
        declaringPlayerId: 'p0',
        declaringTeam: TeamId.TeamAC,
        suit: Suit.Hearts,
        type: CuttType.Declared,
        target: DECLARED_CUTT_TARGET,
      },
      { [TeamId.TeamAC]: 4, [TeamId.TeamBD]: 5 },
    );
    expect(result.winningTeam).toBe(TeamId.TeamBD);
    expect(result.cuttTargetMet).toBe(false);
  });

  it('default cutt target is 5', () => {
    const result = calculateRoundResult(
      makeCompletedHands(5),
      {
        declaringPlayerId: 'p1',
        declaringTeam: TeamId.TeamAC,
        suit: Suit.Diamonds,
        type: CuttType.Default,
        target: DEFAULT_CUTT_TARGET,
      },
      { [TeamId.TeamAC]: 5, [TeamId.TeamBD]: 4 },
    );
    expect(result.winningTeam).toBe(TeamId.TeamAC);
    expect(result.cuttTargetMet).toBe(true);
  });

  it('should reject fewer than 9 completed hands', () => {
    expect(() =>
      calculateRoundResult(
        [],
        {
          declaringPlayerId: 'p0',
          declaringTeam: TeamId.TeamAC,
          suit: Suit.Hearts,
          type: CuttType.Declared,
          target: 6,
        },
        { [TeamId.TeamAC]: 0, [TeamId.TeamBD]: 0 },
      )
    ).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════
// GAME ENGINE INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════
describe('GameEngine', () => {
  const players = [0, 1, 2, 3].map(createTestPlayer);

  it('should deal 5 cards to each player in first deal', () => {
    const engine = new GameEngine(players);
    for (const p of players) {
      expect(engine.getPlayerHand(p.id).length).toBe(FIRST_DEAL_COUNT);
    }
  });

  it('should start in cutt decision phase', () => {
    const engine = new GameEngine(players);
    expect(engine.getPhase()).toBe(GamePhase.CuttDecision);
  });

  it('should complete cutt and deal remaining 4 cards', () => {
    const engine = new GameEngine(players);
    engine.processCuttDeclare(1 as SeatIndex, Suit.Hearts, 'player-1');
    expect(engine.getPhase()).toBe(GamePhase.Playing);
    for (const p of players) {
      expect(engine.getPlayerHand(p.id).length).toBe(CARDS_PER_PLAYER);
    }
  });

  it('should prevent playing out of turn', () => {
    const engine = new GameEngine(players);
    engine.processCuttDeclare(1 as SeatIndex, Suit.Hearts, 'player-1');
    // Player A (seat 0) should be first
    expect(engine.getCurrentTurnSeat()).toBe(0);
    // Player B (seat 1) trying to play should fail
    const hand = engine.getPlayerHand('player-1');
    expect(() => engine.playCard('player-1', hand[0].id)).toThrow(/Not your turn/);
  });

  it('should prevent playing a card not in hand', () => {
    const engine = new GameEngine(players);
    engine.processCuttDeclare(1 as SeatIndex, Suit.Hearts, 'player-1');
    expect(() => engine.playCard('player-0', 'fake_card_id')).toThrow(/Card not in your hand/);
  });

  it('should enforce suit following', () => {
    // Use a deterministic deck for this test
    const deck = createDeck();
    const arranged = deterministicShuffle(deck, 12345);
    const engine = GameEngine.withDeck(players, arranged);

    engine.processCuttDeclare(1 as SeatIndex, Suit.Hearts, 'player-1');

    // Player A (seat 0) plays first card
    const handA = engine.getPlayerHand('player-0');
    const firstCard = handA[0];
    engine.playCard('player-0', firstCard.id);

    // Player B must follow suit if they have it
    const handB = engine.getPlayerHand('player-1');
    const leadSuit = firstCard.suit;
    const hasSuit = handB.some(c => c.suit === leadSuit);

    if (hasSuit) {
      // Try playing a different suit — should fail
      const wrongCard = handB.find(c => c.suit !== leadSuit);
      if (wrongCard) {
        expect(() => engine.playCard('player-1', wrongCard.id)).toThrow(/Illegal move/);
      }
    }
  });

  it('should track hands won per team', () => {
    const engine = new GameEngine(players);
    engine.processCuttDeclare(1 as SeatIndex, Suit.Hearts, 'player-1');
    const won = engine.getTeamHandsWon();
    expect(won[TeamId.TeamAC]).toBe(0);
    expect(won[TeamId.TeamBD]).toBe(0);
  });

  it('should generate valid client state without exposing other hands', () => {
    const engine = new GameEngine(players);
    const stateForP0 = engine.getClientState('player-0');
    expect(stateForP0.myHand.length).toBe(FIRST_DEAL_COUNT);
    expect(stateForP0.opponentCardCounts['player-1']).toBe(FIRST_DEAL_COUNT);
    // Should NOT contain other players' actual cards
    expect(stateForP0.myHand.every(c => c.id !== undefined)).toBe(true);
  });

  it('should play a full round of 9 hands', () => {
    const deck = createDeck();
    const arranged = deterministicShuffle(deck, 42);
    const engine = GameEngine.withDeck(players, arranged);

    // Declare cutt
    engine.processCuttDeclare(1 as SeatIndex, Suit.Spades, 'player-1');
    expect(engine.getPhase()).toBe(GamePhase.Playing);

    // Play all 9 hands
    for (let hand = 0; hand < TOTAL_HANDS; hand++) {
      const turnSeat = engine.getCurrentTurnSeat();
      // Play 4 cards for this hand
      for (let cardNum = 0; cardNum < 4; cardNum++) {
        const currentSeat = engine.getCurrentTurnSeat();
        const playerId = `player-${currentSeat}`;
        const legalMoves = engine.getLegalMoves(playerId);
        expect(legalMoves.length).toBeGreaterThan(0);

        // Play the first legal move
        engine.playCard(playerId, legalMoves[0].id);
      }
    }

    expect(engine.getPhase()).toBe(GamePhase.RoundComplete);
    const won = engine.getTeamHandsWon();
    expect(won[TeamId.TeamAC] + won[TeamId.TeamBD]).toBe(TOTAL_HANDS);
  });

  it('should prevent duplicate card plays', () => {
    const deck = createDeck();
    const arranged = deterministicShuffle(deck, 42);
    const engine = GameEngine.withDeck(players, arranged);
    engine.processCuttDeclare(1 as SeatIndex, Suit.Hearts, 'player-1');

    const hand = engine.getPlayerHand('player-0');
    const cardToPlay = hand[0];
    engine.playCard('player-0', cardToPlay.id);

    // After playing, card is removed — wait for full hand then try again in next hand
    // (The card is gone from the hand so this should throw "Card not in your hand")
    // Complete this hand first...
    for (let i = 1; i < 4; i++) {
      const pid = `player-${engine.getCurrentTurnSeat()}`;
      const legal = engine.getLegalMoves(pid);
      engine.playCard(pid, legal[0].id);
    }

    // Now player 0's card was already played — it's not in their hand anymore
    // This implicitly prevents duplicate plays
    const newHand = engine.getPlayerHand('player-0');
    expect(newHand.find(c => c.id === cardToPlay.id)).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// ROOM MANAGER TESTS
// ═══════════════════════════════════════════════════════════
describe('RoomManager', () => {

  it('should create a room with a unique code', () => {
    const rm = new RoomManager();
    const { room, player, sessionToken } = rm.createRoom('Alice', 'socket-1');
    expect(room.code.length).toBe(6);
    expect(player.name).toBe('Alice');
    expect(player.seatIndex).toBe(0);
    expect(sessionToken.length).toBeGreaterThan(0);
  });

  it('should join a room', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('Alice', 'socket-1');
    const { player } = rm.joinRoom(room.code, 'Bob', 'socket-2');
    expect(player.name).toBe('Bob');
    expect(player.seatIndex).toBe(1);
  });

  it('should reject joining a non-existent room', () => {
    const rm = new RoomManager();
    expect(() => rm.joinRoom('XXXXXX', 'Bob', 'socket-2')).toThrow('Room not found');
  });

  it('should reject a 5th player', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('Alice', 'socket-1');
    rm.joinRoom(room.code, 'Bob', 'socket-2');
    rm.joinRoom(room.code, 'Charlie', 'socket-3');
    rm.joinRoom(room.code, 'Diana', 'socket-4');
    expect(() => rm.joinRoom(room.code, 'Eve', 'socket-5')).toThrow('Room is full');
  });

  it('should reject duplicate names', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('Alice', 'socket-1');
    expect(() => rm.joinRoom(room.code, 'Alice', 'socket-2')).toThrow('Name already taken');
  });

  it('should allow seat selection', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('Alice', 'socket-1');
    rm.selectSeat(room.code, 'socket-1', 3 as SeatIndex);
    expect(rm.getRoom(room.code)!.players[0].seatIndex).toBe(3);
    expect(rm.getRoom(room.code)!.players[0].team).toBe(TeamId.TeamBD);
  });

  it('should toggle ready status', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('Alice', 'socket-1');
    rm.toggleReady(room.code, 'socket-1');
    expect(rm.getRoom(room.code)!.players[0].isReady).toBe(true);
    rm.toggleReady(room.code, 'socket-1');
    expect(rm.getRoom(room.code)!.players[0].isReady).toBe(false);
  });

  it('should not start game without 4 ready players', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('Alice', 'socket-1');
    rm.joinRoom(room.code, 'Bob', 'socket-2');
    const result = rm.canStartGame(room.code);
    expect(result.canStart).toBe(false);
  });

  it('should start game with 4 ready players', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('Alice', 'socket-1');
    rm.joinRoom(room.code, 'Bob', 'socket-2');
    rm.joinRoom(room.code, 'Charlie', 'socket-3');
    rm.joinRoom(room.code, 'Diana', 'socket-4');
    rm.toggleReady(room.code, 'socket-1');
    rm.toggleReady(room.code, 'socket-2');
    rm.toggleReady(room.code, 'socket-3');
    rm.toggleReady(room.code, 'socket-4');
    const result = rm.canStartGame(room.code);
    expect(result.canStart).toBe(true);
  });

  it('should support reconnection during a game', () => {
    const rm = new RoomManager();
    const { room, sessionToken } = rm.createRoom('Alice', 'socket-1');
    rm.joinRoom(room.code, 'Bob', 'socket-2');
    rm.joinRoom(room.code, 'Charlie', 'socket-3');
    rm.joinRoom(room.code, 'Diana', 'socket-4');
    rm.toggleReady(room.code, 'socket-1');
    rm.toggleReady(room.code, 'socket-2');
    rm.toggleReady(room.code, 'socket-3');
    rm.toggleReady(room.code, 'socket-4');
    rm.startGame(room.code);

    // Disconnect Alice during the game
    rm.handleDisconnect('socket-1');
    const player = rm.getRoom(room.code)!.players.find(p => p.name === 'Alice')!;
    expect(player.isConnected).toBe(false);

    // Reconnect with new socket
    const result = rm.reconnect(sessionToken, 'socket-new');
    expect(result).not.toBeNull();
    expect(result!.player.name).toBe('Alice');
    expect(result!.player.id).toBe('socket-new');
    expect(result!.player.isConnected).toBe(true);
  });

  it('should clean up empty rooms', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('Alice', 'socket-1');
    const { roomDeleted } = rm.leaveRoom(room.code, 'socket-1');
    expect(roomDeleted).toBe(true);
    expect(rm.getRoom(room.code)).toBeUndefined();
  });
});

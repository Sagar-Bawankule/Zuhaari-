/**
 * GameEngine — orchestrates the entire game lifecycle.
 * This is the server-authoritative game controller.
 */
import {
  SEAT_TEAM,
  TOTAL_HANDS,
  TeamId,
  type Card,
  type SeatIndex,
  type Suit,
} from '@shared/constants';
import {
  GamePhase,
  type ClientGameState,
  type CompletedHand,
  type CuttDecision,
  type GameState,
  type PlayedCard,
  type Player,
  type PublicPlayer,
} from '@shared/types/index';
import { createDeck } from './deck';
import { shuffleDeck } from './shuffle';
import { dealCards, type DealResult } from './deal';
import {
  createCuttState,
  getCurrentBiddingSeat,
  isDefaultCuttRequired,
  processDefaultCutt,
  processDeclare,
  processPass,
  type CuttState,
} from './cutt';
import { isLegalMove, getLegalMoves } from './rules';
import { resolveHand } from './handResolver';
import { calculateRoundResult } from './scoring';
import type { RoundResult } from '@shared/types/index';

export class GameEngine {
  private gameState: GameState;
  private dealResult: DealResult;
  private cuttState: CuttState;
  private players: Player[];

  constructor(players: Player[]) {
    if (players.length !== 4) {
      throw new Error('Game requires exactly 4 players');
    }
    this.players = players;

    // Create and shuffle deck
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    this.dealResult = dealCards(shuffled);
    this.cuttState = createCuttState();

    this.gameState = {
      phase: GamePhase.FirstDeal,
      deck: shuffled,
      playerHands: new Map(),
      currentTurnSeat: 0 as SeatIndex, // Player A leads
      currentHand: [],
      completedHands: [],
      cuttDecision: null,
      cuttBiddingSeat: 1 as SeatIndex, // Player B bids first
      cuttPassCount: 0,
      leadSuit: null,
      handNumber: 1,
      teamHandsWon: {
        [TeamId.TeamAC]: 0,
        [TeamId.TeamBD]: 0,
      },
    };

    // Deal first 5 cards
    this.dealFirstCards();
  }

  /** Constructor for testing with a pre-arranged deck */
  static withDeck(players: Player[], deck: Card[]): GameEngine {
    const engine = Object.create(GameEngine.prototype) as GameEngine;
    engine.players = players;
    engine.dealResult = dealCards(deck);
    engine.cuttState = createCuttState();
    engine.gameState = {
      phase: GamePhase.FirstDeal,
      deck,
      playerHands: new Map(),
      currentTurnSeat: 0 as SeatIndex,
      currentHand: [],
      completedHands: [],
      cuttDecision: null,
      cuttBiddingSeat: 1 as SeatIndex,
      cuttPassCount: 0,
      leadSuit: null,
      handNumber: 1,
      teamHandsWon: {
        [TeamId.TeamAC]: 0,
        [TeamId.TeamBD]: 0,
      },
    };
    engine.dealFirstCards();
    return engine;
  }

  private dealFirstCards(): void {
    for (let i = 0; i < 4; i++) {
      const player = this.players[i];
      this.gameState.playerHands.set(player.id, [...this.dealResult.firstDeal[i]]);
    }
    this.gameState.phase = GamePhase.CuttDecision;
  }

  private dealSecondCards(): void {
    for (let i = 0; i < 4; i++) {
      const player = this.players[i];
      const existing = this.gameState.playerHands.get(player.id)!;
      existing.push(...this.dealResult.secondDeal[i]);
    }
    this.gameState.phase = GamePhase.Playing;
  }

  // ─── Cutt Bidding ────────────────────────────────────────

  getCuttBiddingSeat(): SeatIndex {
    if (isDefaultCuttRequired(this.cuttState)) {
      return this.cuttState.config.defaultCuttSeat;
    }
    return getCurrentBiddingSeat(this.cuttState);
  }

  isCuttPhase(): boolean {
    return this.gameState.phase === GamePhase.CuttDecision;
  }

  isDefaultCuttRequired(): boolean {
    return isDefaultCuttRequired(this.cuttState);
  }

  processCuttDeclare(seatIndex: SeatIndex, suit: Suit, playerId: string): CuttDecision {
    if (this.gameState.phase !== GamePhase.CuttDecision) {
      throw new Error('Not in cutt decision phase');
    }

    const teamId = SEAT_TEAM[seatIndex];

    if (isDefaultCuttRequired(this.cuttState)) {
      // Default cutt — forced on the default seat
      if (seatIndex !== this.cuttState.config.defaultCuttSeat) {
        throw new Error(`Only seat ${this.cuttState.config.defaultCuttSeat} can make default cutt`);
      }
      this.cuttState = processDefaultCutt(this.cuttState, suit, playerId, teamId);
    } else {
      this.cuttState = processDeclare(this.cuttState, seatIndex, suit, playerId, teamId);
    }

    this.gameState.cuttDecision = this.cuttState.decision;
    this.gameState.phase = GamePhase.SecondDeal;

    // Deal remaining cards
    this.dealSecondCards();

    return this.cuttState.decision!;
  }

  processCuttPass(seatIndex: SeatIndex): { allPassed: boolean; nextSeat: SeatIndex } {
    if (this.gameState.phase !== GamePhase.CuttDecision) {
      throw new Error('Not in cutt decision phase');
    }

    this.cuttState = processPass(this.cuttState, seatIndex);
    this.gameState.cuttPassCount = this.cuttState.passCount;

    const allPassed = isDefaultCuttRequired(this.cuttState);
    const nextSeat = allPassed
      ? this.cuttState.config.defaultCuttSeat
      : getCurrentBiddingSeat(this.cuttState);

    this.gameState.cuttBiddingSeat = nextSeat;

    return { allPassed, nextSeat };
  }

  // ─── Card Playing ────────────────────────────────────────

  playCard(playerId: string, cardId: string): {
    playedCard: PlayedCard;
    handComplete: boolean;
    handResult?: CompletedHand;
    roundComplete: boolean;
    roundResult?: RoundResult;
  } {
    if (this.gameState.phase !== GamePhase.Playing) {
      throw new Error('Not in playing phase');
    }

    // Verify turn
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');
    if (player.seatIndex !== this.gameState.currentTurnSeat) {
      throw new Error(`Not your turn. Current turn: seat ${this.gameState.currentTurnSeat}`);
    }

    // Find card in hand
    const hand = this.gameState.playerHands.get(playerId)!;
    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error('Card not in your hand');
    }

    const card = hand[cardIndex];

    // Validate legal move
    const leadSuit = this.gameState.currentHand.length > 0
      ? this.gameState.currentHand[0].card.suit
      : null;

    if (!isLegalMove(card, hand, leadSuit)) {
      throw new Error(`Illegal move: must follow suit ${leadSuit}`);
    }

    // Remove card from hand
    hand.splice(cardIndex, 1);

    // Set lead suit if first card
    if (this.gameState.currentHand.length === 0) {
      this.gameState.leadSuit = card.suit;
    }

    // Add to current hand
    const playedCard: PlayedCard = {
      playerId,
      seatIndex: player.seatIndex,
      card,
    };
    this.gameState.currentHand.push(playedCard);

    // Check if hand is complete (4 cards played)
    if (this.gameState.currentHand.length === 4) {
      return this.completeHand();
    }

    // Advance turn
    this.gameState.currentTurnSeat = ((this.gameState.currentTurnSeat + 1) % 4) as SeatIndex;

    return {
      playedCard,
      handComplete: false,
      roundComplete: false,
    };
  }

  private completeHand(): {
    playedCard: PlayedCard;
    handComplete: boolean;
    handResult: CompletedHand;
    roundComplete: boolean;
    roundResult?: RoundResult;
  } {
    const trumpSuit = this.gameState.cuttDecision!.suit;
    const result = resolveHand(this.gameState.currentHand, trumpSuit);

    const completedHand: CompletedHand = {
      handNumber: this.gameState.handNumber,
      cards: [...this.gameState.currentHand],
      winnerId: result.winnerId,
      winnerSeat: result.winnerSeat as SeatIndex,
      winningTeam: result.winningTeam as TeamId,
    };

    // Update team hands won
    this.gameState.teamHandsWon[result.winningTeam as TeamId]++;
    this.gameState.completedHands.push(completedHand);

    const lastPlayedCard = this.gameState.currentHand[3];

    // Reset for next hand
    this.gameState.currentHand = [];
    this.gameState.leadSuit = null;
    this.gameState.handNumber++;

    // Winner leads next hand
    this.gameState.currentTurnSeat = result.winnerSeat as SeatIndex;

    // Check if round is complete
    if (this.gameState.completedHands.length >= TOTAL_HANDS) {
      this.gameState.phase = GamePhase.RoundComplete;
      const roundResult = calculateRoundResult(
        this.gameState.completedHands,
        this.gameState.cuttDecision!,
        this.gameState.teamHandsWon,
      );

      return {
        playedCard: lastPlayedCard,
        handComplete: true,
        handResult: completedHand,
        roundComplete: true,
        roundResult,
      };
    }

    return {
      playedCard: lastPlayedCard,
      handComplete: true,
      handResult: completedHand,
      roundComplete: false,
    };
  }

  // ─── Getters ─────────────────────────────────────────────

  getPhase(): GamePhase {
    return this.gameState.phase;
  }

  getPlayerHand(playerId: string): Card[] {
    return this.gameState.playerHands.get(playerId) ?? [];
  }

  getPlayerCardCount(playerId: string): number {
    return (this.gameState.playerHands.get(playerId) ?? []).length;
  }

  getCurrentTurnSeat(): SeatIndex {
    return this.gameState.currentTurnSeat;
  }

  getCuttDecision(): CuttDecision | null {
    return this.gameState.cuttDecision;
  }

  getTeamHandsWon(): Record<TeamId, number> {
    return { ...this.gameState.teamHandsWon };
  }

  getHandNumber(): number {
    return this.gameState.handNumber;
  }

  getCompletedHands(): CompletedHand[] {
    return [...this.gameState.completedHands];
  }

  getCurrentHand(): PlayedCard[] {
    return [...this.gameState.currentHand];
  }

  getLegalMoves(playerId: string): Card[] {
    const hand = this.getPlayerHand(playerId);
    const leadSuit = this.gameState.currentHand.length > 0
      ? this.gameState.currentHand[0].card.suit
      : null;
    return getLegalMoves(hand, leadSuit);
  }

  /** Build the client-visible game state for a specific player. */
  getClientState(playerId: string): ClientGameState {
    const opponentCardCounts: Record<string, number> = {};
    for (const p of this.players) {
      if (p.id !== playerId) {
        opponentCardCounts[p.id] = this.getPlayerCardCount(p.id);
      }
    }

    return {
      phase: this.gameState.phase,
      myHand: this.getPlayerHand(playerId),
      opponentCardCounts,
      currentTurnSeat: this.gameState.currentTurnSeat,
      currentHand: this.gameState.currentHand,
      completedHands: this.gameState.completedHands,
      cuttDecision: this.gameState.cuttDecision,
      cuttBiddingSeat: this.getCuttBiddingSeat(),
      leadSuit: this.gameState.leadSuit,
      handNumber: this.gameState.handNumber,
      teamHandsWon: this.gameState.teamHandsWon,
      players: this.players.map(p => this.toPublicPlayer(p)),
    };
  }

  private toPublicPlayer(player: Player): PublicPlayer {
    return {
      id: player.id,
      name: player.name,
      seatIndex: player.seatIndex,
      team: player.team,
      isReady: player.isReady,
      isConnected: player.isConnected,
      cardCount: this.getPlayerCardCount(player.id),
    };
  }
}

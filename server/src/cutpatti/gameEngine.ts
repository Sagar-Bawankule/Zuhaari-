import {
  CutpattiCard,
  CutpattiSuit,
  CUTPATTI_MIN_PLAYERS,
  CUTPATTI_MAX_PLAYERS,
} from '@shared/cutpatti/constants';
import {
  CutpattiClientGameState,
  CutpattiCompletedTrick,
  CutpattiGameState,
  CutpattiPhase,
  CutpattiPlayedCard,
  CutpattiPlayer,
  CutpattiPublicPlayer,
  CutpattiRoundResult,
} from '@shared/cutpatti/types';
import { prepareDeckForPlayers, dealCutpattiHands } from './distribution';
import { selectRandomTrump } from './trump';
import { validateBid, areAllBidsSubmitted } from './bidding';
import { isCardLegal } from './rules';
import { resolveCutpattiTrick } from './trickResolver';
import {
  calculateRoundScores,
  updateCumulativeScores,
  buildRoundResult,
} from './scoring';

export class CutpattiGameEngine {
  public state: CutpattiGameState;
  private players: CutpattiPlayer[];

  constructor(players: CutpattiPlayer[], existingTotals?: Record<string, number>) {
    if (players.length < CUTPATTI_MIN_PLAYERS || players.length > CUTPATTI_MAX_PLAYERS) {
      throw new Error(`Cutpatti requires 3 to 6 players, got ${players.length}`);
    }

    this.players = [...players];
    const initialTotals: Record<string, number> = existingTotals || {};
    for (const p of this.players) {
      if (typeof initialTotals[p.id] !== 'number') {
        initialTotals[p.id] = 0;
      }
    }

    this.state = this.initializeRound(1, initialTotals);
  }

  /**
   * Initializes a new round: prepares deck, deals cards, selects random trump suit.
   */
  public initializeRound(
    roundNumber: number,
    existingTotals: Record<string, number>,
    forcedTrump?: CutpattiSuit,
    forcedDeck?: CutpattiCard[]
  ): CutpattiGameState {
    const playerCount = this.players.length;
    const { deck, excludedCards, cardsPerPlayer } = prepareDeckForPlayers(
      playerCount,
      forcedDeck
    );
    const { hands } = dealCutpattiHands(deck, playerCount, cardsPerPlayer);

    const playerHands = new Map<string, CutpattiCard[]>();
    for (let i = 0; i < playerCount; i++) {
      playerHands.set(this.players[i].id, hands[i]);
    }

    const trumpSuit = forcedTrump || selectRandomTrump();

    const bids: Record<string, number> = {};
    const tricksWon: Record<string, number> = {};
    const roundScores: Record<string, number> = {};

    for (const p of this.players) {
      tricksWon[p.id] = 0;
      roundScores[p.id] = 0;
    }

    // Lead player alternates clockwise each round
    const startLeadSeat = (roundNumber - 1) % playerCount;

    const state: CutpattiGameState = {
      phase: CutpattiPhase.Bidding,
      trumpSuit,
      cardsPerPlayer,
      totalTricks: cardsPerPlayer,
      currentTrickNumber: 1,
      leadSuit: null,
      currentTurnSeat: startLeadSeat,
      currentTrick: [],
      completedTricks: [],
      playerHands,
      bids,
      tricksWon,
      roundScores,
      totalScores: { ...existingTotals },
      excludedCardIds: excludedCards.map((c) => c.id),
      roundNumber,
    };

    this.state = state;
    return state;
  }

  /**
   * Player submits their trick bid for the round.
   */
  public submitBid(playerId: string, bid: number): { success: boolean; allBidsDone: boolean; error?: string } {
    if (this.state.phase !== CutpattiPhase.Bidding) {
      return { success: false, allBidsDone: false, error: 'Not in bidding phase' };
    }

    const player = this.players.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, allBidsDone: false, error: 'Player not in game' };
    }

    if (typeof this.state.bids[playerId] === 'number') {
      return { success: false, allBidsDone: false, error: 'Bid already submitted for this round' };
    }

    const validation = validateBid(bid, this.state.cardsPerPlayer);
    if (!validation.valid) {
      return { success: false, allBidsDone: false, error: validation.reason };
    }

    this.state.bids[playerId] = bid;

    const playerIds = this.players.map((p) => p.id);
    const allDone = areAllBidsSubmitted(this.state.bids, playerIds);

    if (allDone) {
      this.state.phase = CutpattiPhase.Playing;
    }

    return { success: true, allBidsDone: allDone };
  }

  /**
   * Player plays a card to the current trick.
   */
  public playCard(
    playerId: string,
    cardId: string
  ): {
    success: boolean;
    playedCard?: CutpattiPlayedCard;
    completedTrick?: CutpattiCompletedTrick;
    roundResult?: CutpattiRoundResult;
    error?: string;
  } {
    if (this.state.phase !== CutpattiPhase.Playing) {
      return { success: false, error: 'Not in playing phase' };
    }

    const player = this.players.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not in game' };
    }

    if (player.seatIndex !== this.state.currentTurnSeat) {
      return { success: false, error: 'Not your turn' };
    }

    const hand = this.state.playerHands.get(playerId);
    if (!hand) {
      return { success: false, error: 'Player hand not found' };
    }

    const card = hand.find((c) => c.id === cardId);
    if (!card) {
      return { success: false, error: 'Card not in hand' };
    }

    if (!isCardLegal(cardId, hand, this.state.leadSuit)) {
      return { success: false, error: 'Illegal move: you must follow the lead suit if possible' };
    }

    // Remove card from hand
    this.state.playerHands.set(
      playerId,
      hand.filter((c) => c.id !== cardId)
    );

    // If first card in trick, set lead suit
    if (this.state.currentTrick.length === 0) {
      this.state.leadSuit = card.suit;
    }

    const playedCard: CutpattiPlayedCard = {
      playerId,
      seatIndex: player.seatIndex,
      playerName: player.name,
      card,
    };
    this.state.currentTrick.push(playedCard);

    // If trick is not yet complete, advance to next player clockwise
    if (this.state.currentTrick.length < this.players.length) {
      this.state.currentTurnSeat = (this.state.currentTurnSeat + 1) % this.players.length;
      return { success: true, playedCard };
    }

    // Trick is complete! Resolve winner
    const trickResult = resolveCutpattiTrick(this.state.currentTrick, this.state.trumpSuit);
    const winnerPlayer = this.players.find((p) => p.id === trickResult.winner.playerId)!;

    this.state.tricksWon[winnerPlayer.id] = (this.state.tricksWon[winnerPlayer.id] || 0) + 1;

    const completedTrick: CutpattiCompletedTrick = {
      trickNumber: this.state.currentTrickNumber,
      cards: [...this.state.currentTrick],
      winnerId: winnerPlayer.id,
      winnerSeat: winnerPlayer.seatIndex,
      winnerName: winnerPlayer.name,
      winningCard: trickResult.winningCard,
    };
    this.state.completedTricks.push(completedTrick);

    // Winner leads next trick
    this.state.currentTurnSeat = winnerPlayer.seatIndex;
    this.state.currentTrick = [];
    this.state.leadSuit = null;
    this.state.currentTrickNumber += 1;

    // Check if all tricks for the round are complete
    if (this.state.completedTricks.length >= this.state.totalTricks) {
      this.state.phase = CutpattiPhase.RoundComplete;

      const playerIds = this.players.map((p) => p.id);
      this.state.roundScores = calculateRoundScores(
        this.state.bids,
        this.state.tricksWon,
        playerIds
      );
      this.state.totalScores = updateCumulativeScores(
        this.state.totalScores,
        this.state.roundScores,
        playerIds
      );

      const roundResult = buildRoundResult(
        this.state.roundNumber,
        this.state.trumpSuit,
        this.players,
        this.state.bids,
        this.state.tricksWon,
        this.state.roundScores,
        this.state.totalScores
      );

      return { success: true, playedCard, completedTrick, roundResult };
    }

    return { success: true, playedCard, completedTrick };
  }

  /**
   * Starts the next round.
   */
  public nextRound(): CutpattiGameState {
    return this.initializeRound(this.state.roundNumber + 1, this.state.totalScores);
  }

  /**
   * Serializes public player list.
   */
  public getPublicPlayers(): CutpattiPublicPlayer[] {
    return this.players.map((p) => {
      const hand = this.state.playerHands.get(p.id) || [];
      const hasBid = typeof this.state.bids[p.id] === 'number';
      // In Bidding phase, don't reveal other players' bid amounts until bidding is complete
      const bid =
        this.state.phase === CutpattiPhase.Bidding
          ? hasBid ? -1 : null // -1 means "submitted" but amount hidden
          : (this.state.bids[p.id] ?? null);

      return {
        id: p.id,
        name: p.name,
        seatIndex: p.seatIndex,
        isReady: p.isReady,
        isConnected: p.isConnected,
        isHost: p.isHost,
        cardCount: hand.length,
        bid,
        tricksWon: this.state.tricksWon[p.id] ?? 0,
        roundScore: this.state.roundScores[p.id] ?? null,
        totalScore: this.state.totalScores[p.id] ?? 0,
      };
    });
  }

  /**
   * Returns authoritative client game state tailored to a specific player (never exposing opponents' cards).
   */
  public getClientState(playerId: string): CutpattiClientGameState {
    const myHand = this.state.playerHands.get(playerId) || [];
    const opponentCardCounts: Record<string, number> = {};

    for (const p of this.players) {
      if (p.id !== playerId) {
        opponentCardCounts[p.id] = (this.state.playerHands.get(p.id) || []).length;
      }
    }

    // Mask opponents' bid amounts during bidding phase
    const clientBids: Record<string, number> = {};
    for (const p of this.players) {
      if (this.state.phase === CutpattiPhase.Bidding) {
        if (p.id === playerId) {
          if (typeof this.state.bids[p.id] === 'number') {
            clientBids[p.id] = this.state.bids[p.id];
          }
        } else if (typeof this.state.bids[p.id] === 'number') {
          clientBids[p.id] = -1; // Flag indicating bid was placed
        }
      } else if (typeof this.state.bids[p.id] === 'number') {
        clientBids[p.id] = this.state.bids[p.id];
      }
    }

    return {
      phase: this.state.phase,
      trumpSuit: this.state.trumpSuit,
      cardsPerPlayer: this.state.cardsPerPlayer,
      totalTricks: this.state.totalTricks,
      currentTrickNumber: Math.min(this.state.currentTrickNumber, this.state.totalTricks),
      leadSuit: this.state.leadSuit,
      currentTurnSeat: this.state.currentTurnSeat,
      currentTrick: this.state.currentTrick,
      completedTricks: this.state.completedTricks,
      myHand: [...myHand],
      opponentCardCounts,
      bids: clientBids,
      tricksWon: { ...this.state.tricksWon },
      roundScores: { ...this.state.roundScores },
      totalScores: { ...this.state.totalScores },
      excludedCardIds: [...this.state.excludedCardIds],
      roundNumber: this.state.roundNumber,
      players: this.getPublicPlayers(),
    };
  }

  public getRoundResult(): CutpattiRoundResult {
    return buildRoundResult(
      this.state.roundNumber,
      this.state.trumpSuit,
      this.players,
      this.state.bids,
      this.state.tricksWon,
      this.state.roundScores,
      this.state.totalScores
    );
  }

  public getPlayers(): CutpattiPlayer[] {
    return this.players;
  }
}

import React, { useMemo } from 'react';
import { useCutpattiStore } from '../../store/cutpattiStore';
import { Card } from '../Card';
import { CardBack } from '../CardBack';
import { CutpattiBiddingModal } from './CutpattiBiddingModal';
import { CutpattiRoundResultModal } from './CutpattiRoundResultModal';
import {
  CutpattiCard,
  CutpattiSuit,
  CUTPATTI_SUIT_SYMBOLS,
  CUTPATTI_SUIT_COLORS,
} from '@shared/cutpatti/constants';
import { isCardLegal } from '@shared/cutpatti/rules';

export const CutpattiGameTable: React.FC = () => {
  const {
    gameState,
    myPlayerId,
    isMyTurn,
    playCard,
    trickNotice,
  } = useCutpattiStore();

  if (!gameState) return null;

  const players = gameState.players || [];
  const playerCount = players.length;
  const myPlayer = players.find((p) => p.id === myPlayerId);
  const mySeatIndex = myPlayer ? myPlayer.seatIndex : 0;
  const myTurn = isMyTurn();
  const trump = gameState.trumpSuit;
  const trumpColor = CUTPATTI_SUIT_COLORS[trump];

  // Sort player's hand by suit and descending rank strength for convenient play
  const sortedHand = useMemo(() => {
    return [...(gameState.myHand || [])].sort((a, b) => {
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return b.strength - a.strength;
    });
  }, [gameState.myHand]);

  // Determine relative seating so current player is always at the bottom
  const relativeOpponents = useMemo(() => {
    if (!myPlayer) return [];
    const opponents = [];
    for (let i = 1; i < playerCount; i++) {
      const seat = (mySeatIndex + i) % playerCount;
      const player = players.find((p) => p.seatIndex === seat);
      if (player) opponents.push({ player, relativePos: i });
    }
    return opponents;
  }, [myPlayer, mySeatIndex, playerCount, players]);

  /**
   * Layout position CSS classes for variable player counts (3–6 players)
   */
  const getOpponentPositionClass = (relativeIndex: number, totalOpponents: number) => {
    if (totalOpponents === 2) {
      // 3 players total: index 0 -> top-left, index 1 -> top-right
      return relativeIndex === 0
        ? 'top-2 left-4 sm:top-6 sm:left-12'
        : 'top-2 right-4 sm:top-6 sm:right-12';
    }
    if (totalOpponents === 3) {
      // 4 players total: left, top, right
      if (relativeIndex === 0) return 'top-1/2 -translate-y-1/2 left-2 sm:left-6';
      if (relativeIndex === 1) return 'top-2 sm:top-4 left-1/2 -translate-x-1/2';
      return 'top-1/2 -translate-y-1/2 right-2 sm:right-6';
    }
    if (totalOpponents === 4) {
      // 5 players total: bottom-left, top-left, top-right, right
      if (relativeIndex === 0) return 'bottom-36 left-2 sm:left-6';
      if (relativeIndex === 1) return 'top-2 left-10 sm:top-4 sm:left-24';
      if (relativeIndex === 2) return 'top-2 right-10 sm:top-4 sm:right-24';
      return 'bottom-36 right-2 sm:right-6';
    }
    // 6 players total: bottom-left, top-left, top-center, top-right, bottom-right
    if (relativeIndex === 0) return 'bottom-36 left-2 sm:left-4';
    if (relativeIndex === 1) return 'top-8 left-4 sm:top-6 sm:left-16';
    if (relativeIndex === 2) return 'top-2 left-1/2 -translate-x-1/2';
    if (relativeIndex === 3) return 'top-8 right-4 sm:top-6 sm:right-16';
    return 'bottom-36 right-2 sm:right-4';
  };

  const handleCardClick = (card: CutpattiCard) => {
    if (!myTurn || gameState.phase !== 'playing') return;
    const legal = isCardLegal(card.id, gameState.myHand, gameState.leadSuit);
    if (!legal) return;
    playCard(card.id);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] max-w-7xl mx-auto flex flex-col justify-between overflow-hidden p-2 select-none animate-fade-in">
      {/* ─── Top Info Bar ────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-charcoal-900/80 backdrop-blur-md border border-charcoal-800 z-20 text-xs">
        {/* Left: Round & Trick info */}
        <div className="flex items-center gap-3">
          <span className="font-display font-black text-ivory-100 flex items-center gap-1">
            <span className="text-emerald-400">R#{gameState.roundNumber}</span>
            <span className="text-charcoal-500">&bull;</span>
            <span>
              Trick {gameState.currentTrickNumber}/{gameState.totalTricks}
            </span>
          </span>

          {gameState.leadSuit && (
            <span className="hidden sm:inline text-charcoal-400 text-[11px]">
              Lead: <strong className="text-ivory-200 uppercase">{gameState.leadSuit}</strong>
            </span>
          )}
        </div>

        {/* Center: Trump Suit Banner */}
        <div className="flex items-center gap-1.5 bg-charcoal-800/90 border border-charcoal-700/80 px-3 py-1 rounded-full shadow-md">
          <span className="text-[10px] text-charcoal-400 uppercase font-semibold">Trump:</span>
          <span
            className={`font-black text-sm flex items-center gap-1 uppercase ${
              trumpColor === 'red' ? 'text-red-400' : 'text-ivory-100'
            }`}
          >
            <span>{CUTPATTI_SUIT_SYMBOLS[trump]}</span>
            <span className="text-xs">{trump}</span>
          </span>
        </div>

        {/* Right: Turn status */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              myTurn
                ? 'bg-emerald-500 text-charcoal-950 animate-bounce'
                : 'bg-charcoal-800 text-charcoal-300'
            }`}
          >
            {myTurn
              ? 'Your Turn!'
              : `${players[gameState.currentTurnSeat]?.name || 'Waiting'}'s Turn`}
          </span>
        </div>
      </div>

      {/* ─── Main Poker Felt Area ──────────────────────────────── */}
      <div className="relative flex-1 w-full my-2 rounded-3xl bg-gradient-to-b from-emerald-950/80 via-emerald-900/60 to-emerald-950/90 border-4 border-charcoal-800/90 shadow-2xl flex items-center justify-center overflow-hidden">
        {/* Felt Watermark Pattern */}
        <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none text-9xl">
          ♠ ♥ ♦ ♣
        </div>

        {/* Notice Banner */}
        {trickNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold shadow-lg animate-fade-in pointer-events-none">
            {trickNotice}
          </div>
        )}

        {/* ─── Opponents Arranged Around Table ───────────────────── */}
        {relativeOpponents.map(({ player, relativePos }, idx) => {
          const isPlayerTurn = gameState.currentTurnSeat === player.seatIndex;
          const posClass = getOpponentPositionClass(idx, relativeOpponents.length);
          const opponentCardCount = gameState.opponentCardCounts[player.id] ?? 0;
          const hasBid = player.bid !== null;

          return (
            <div
              key={player.id}
              className={`absolute ${posClass} z-10 flex flex-col items-center transition-all`}
            >
              {/* Opponent Card Stack */}
              <div className="flex items-center -space-x-8 mb-1 scale-75 sm:scale-90">
                {Array.from({ length: Math.min(opponentCardCount, 6) }).map((_, cIdx) => (
                  <CardBack key={cIdx} className="shadow-md" />
                ))}
              </div>

              {/* Player Info Badge */}
              <div
                className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-center transition-all ${
                  isPlayerTurn
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/30'
                    : 'bg-charcoal-900/80 border-charcoal-700/80 text-ivory-200 shadow-md'
                }`}
              >
                <div className="flex items-center gap-1 justify-center">
                  <span className="font-bold text-xs truncate max-w-[90px]">
                    {player.name}
                  </span>
                  {player.isHost && <span className="text-[10px] text-amber-400">👑</span>}
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-charcoal-400 font-mono mt-0.5">
                  <span>
                    Bid: <strong className="text-ivory-100">{hasBid ? player.bid : '...'}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Won: <strong className="text-emerald-400">{player.tricksWon}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* ─── Center Trick Play Area ────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center justify-center p-4">
          <div className="min-h-[140px] flex items-center justify-center gap-3">
            {gameState.currentTrick.length > 0 ? (
              gameState.currentTrick.map((played, idx) => (
                <div
                  key={`${played.card.id}-${idx}`}
                  className="flex flex-col items-center animate-slide-up"
                >
                  <Card
                    card={played.card}
                    isTrump={played.card.suit === trump}
                    size="md"
                    className="shadow-2xl"
                  />
                  <span className="mt-1 text-[11px] font-bold text-ivory-200 bg-charcoal-900/90 px-2 py-0.5 rounded-md border border-charcoal-700 shadow-sm">
                    {played.playerName}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center p-4 rounded-2xl border border-dashed border-emerald-700/40 text-emerald-400/60 text-xs italic">
                {myTurn ? 'Lead any card to start trick' : 'Waiting for lead card...'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Area: Current Player Hand & HUD ────────────── */}
      <div className="w-full flex flex-col items-center z-20">
        {/* HUD Bar above hand */}
        <div className="w-full max-w-xl flex items-center justify-between px-3 py-1 bg-charcoal-900/90 border border-charcoal-800 rounded-t-xl text-xs mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ivory-100">{myPlayer?.name || 'You'}</span>
            <span className="text-[11px] text-charcoal-400 font-mono">
              Bid: <strong className="text-ivory-200">{myPlayer?.bid ?? '-'}</strong>
            </span>
            <span className="text-charcoal-600">&bull;</span>
            <span className="text-[11px] text-charcoal-400 font-mono">
              Won: <strong className="text-emerald-400">{myPlayer?.tricksWon ?? 0}</strong>
            </span>
          </div>

          <span className="text-[11px] text-charcoal-400">
            {myTurn ? 'Select a highlighted card to play' : 'Waiting for turn'}
          </span>
        </div>

        {/* Player's Hand Cards Fan */}
        <div className="w-full flex items-center justify-center -space-x-3 sm:-space-x-5 overflow-x-auto py-1 px-4 max-w-full">
          {sortedHand.map((card) => {
            const isLegal =
              myTurn &&
              gameState.phase === 'playing' &&
              isCardLegal(card.id, gameState.myHand, gameState.leadSuit);

            return (
              <Card
                key={card.id}
                card={card}
                isPlayable={isLegal}
                isTrump={card.suit === trump}
                onClick={isLegal ? () => handleCardClick(card) : undefined}
                size="md"
                className="transform transition-transform hover:-translate-y-4"
              />
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <CutpattiBiddingModal />
      <CutpattiRoundResultModal />
    </div>
  );
};

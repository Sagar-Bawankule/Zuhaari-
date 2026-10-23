import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Card } from './Card';
import { CardBack } from './CardBack';
import { Hand } from './Hand';
import { SuitIcon } from './SuitIcon';
import {
  SeatIndex,
  SEAT_LABELS,
  SEAT_TEAM,
  TeamId,
  TEAM_NAMES,
  SUIT_SYMBOLS,
  SUIT_COLORS,
} from '@shared/constants';
import { PublicPlayer, PlayedCard } from '@shared/types/index';

export const GameTable: React.FC = () => {
  const {
    gameState,
    mySeatIndex,
    room,
    handWinnerNotice,
    isMyTurn,
  } = useGameStore();

  if (!gameState || !room || mySeatIndex === null) return null;

  const currentTurn = gameState.currentTurnSeat;
  const cuttDecision = gameState.cuttDecision;
  const leadSuit = gameState.leadSuit;
  const trumpSuit = cuttDecision?.suit || null;

  // Map each seat index to relative screen position: 0=Bottom (Me), 1=Left, 2=Top, 3=Right
  const getRelativePosition = (seat: SeatIndex): 'bottom' | 'left' | 'top' | 'right' => {
    const diff = (seat - mySeatIndex + 4) % 4;
    switch (diff) {
      case 0:
        return 'bottom';
      case 1:
        return 'left';
      case 2:
        return 'top';
      case 3:
        return 'right';
      default:
        return 'bottom';
    }
  };

  // Find player by seat
  const getPlayerAtSeat = (seat: SeatIndex): PublicPlayer | undefined => {
    return room.players.find((p) => p.seatIndex === seat);
  };

  // Find played card by seat for current hand
  const getPlayedCardAtSeat = (seat: SeatIndex): PlayedCard | undefined => {
    return gameState.currentHand.find((pc) => pc.seatIndex === seat);
  };

  // Seats in table order relative to current player
  const seatPositions: { seat: SeatIndex; pos: 'bottom' | 'left' | 'top' | 'right' }[] = [0, 1, 2, 3].map(
    (s) => ({
      seat: s as SeatIndex,
      pos: getRelativePosition(s as SeatIndex),
    })
  );

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-between min-h-[calc(100vh-80px)] px-2 sm:px-4 py-2 select-none overflow-hidden">
      {/* ─── Top Score & Trump HUD ───────────────────────────── */}
      <div className="w-full max-w-4xl glass-panel px-4 py-2.5 mb-2 flex flex-wrap items-center justify-between gap-3 border-gold-500/20 text-xs sm:text-sm">
        {/* Teams Score */}
        <div className="flex items-center gap-4">
          {/* Team AC */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
            <span className="font-bold text-blue-400">Team AC:</span>
            <span className="font-mono font-black text-ivory-100 text-base">
              {gameState.teamHandsWon[TeamId.TeamAC] || 0}
            </span>
          </div>

          <span className="text-charcoal-600 font-bold">vs</span>

          {/* Team BD */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
            <span className="font-bold text-amber-400">Team BD:</span>
            <span className="font-mono font-black text-ivory-100 text-base">
              {gameState.teamHandsWon[TeamId.TeamBD] || 0}
            </span>
          </div>
        </div>

        {/* Hand tracker */}
        <div className="px-3 py-1 rounded-full bg-charcoal-800/80 border border-charcoal-700 font-medium text-charcoal-300">
          Hand <strong className="text-ivory-100">{gameState.handNumber}</strong> of 9
        </div>

        {/* Trump Badge */}
        {cuttDecision && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-gold-500/10 border border-gold-500/30">
            <span className="text-charcoal-400 font-medium">Trump:</span>
            <span
              className={`text-base font-black ${
                SUIT_COLORS[cuttDecision.suit] === 'red' ? 'text-red-500' : 'text-ivory-100'
              }`}
            >
              {SUIT_SYMBOLS[cuttDecision.suit]} {cuttDecision.suit.toUpperCase()}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-300 font-mono">
              Target: {cuttDecision.target}
            </span>
          </div>
        )}
      </div>

      {/* ─── Felt Green Poker Table ───────────────────────────── */}
      <div className="relative w-full max-w-4xl h-[460px] sm:h-[520px] md:h-[560px] my-auto rounded-[60px] sm:rounded-[90px] bg-gradient-to-br from-emerald-800 via-table-600 to-table-900 border-[8px] sm:border-[12px] border-charcoal-800 shadow-2xl shadow-black/80 flex items-center justify-center p-4 overflow-hidden">
        {/* Felt Texture & Ring */}
        <div className="absolute inset-2 sm:inset-4 rounded-[45px] sm:rounded-[75px] border border-gold-500/20 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

        {/* Center Table Watermark Logo */}
        <div className="absolute flex flex-col items-center justify-center opacity-10 pointer-events-none">
          <span className="text-8xl sm:text-9xl font-display font-black tracking-widest text-gold-400">
            ZUHAARI
          </span>
        </div>

        {/* Trick Winner Flash Toast in Center */}
        {handWinnerNotice && (
          <div className="absolute z-30 px-6 py-3 rounded-2xl bg-charcoal-950/90 border-2 border-gold-400 text-center shadow-2xl animate-fade-in backdrop-blur-md">
            <span className="text-gold-400 text-xs uppercase tracking-widest font-bold block">
              Hand Won!
            </span>
            <p className="text-lg sm:text-xl font-display font-black text-ivory-100 mt-0.5">
              🏆 {handWinnerNotice.winnerName}
            </p>
            <span className="text-xs text-charcoal-300">
              won for {handWinnerNotice.team}
            </span>
          </div>
        )}

        {/* ─── Seat: TOP (Opponent or Partner) ────────────────── */}
        {(() => {
          const item = seatPositions.find((sp) => sp.pos === 'top');
          if (!item) return null;
          const player = getPlayerAtSeat(item.seat);
          const isTurn = currentTurn === item.seat;
          const cardCount = player ? gameState.opponentCardCounts[player.id] || 0 : 0;
          const isTeamAC = SEAT_TEAM[item.seat] === TeamId.TeamAC;

          return (
            <div className="absolute top-3 sm:top-5 flex flex-col items-center z-10">
              {/* Opponent Card Backs */}
              <div className="flex -space-x-8 sm:-space-x-10 mb-2">
                {Array.from({ length: Math.min(cardCount, 9) }).map((_, i) => (
                  <CardBack key={i} size="sm" />
                ))}
              </div>

              {/* Player Tag */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 backdrop-blur-md border ${
                  isTurn
                    ? 'bg-gold-500/20 border-gold-400 text-gold-300 ring-2 ring-gold-400/60 animate-pulse'
                    : 'bg-charcoal-900/80 border-charcoal-700 text-ivory-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isTeamAC ? 'bg-blue-400' : 'bg-amber-400'
                  }`}
                />
                <span>
                  {player ? player.name : `Seat ${SEAT_LABELS[item.seat]}`} (
                  {SEAT_LABELS[item.seat]})
                </span>
                <span className="text-[10px] text-charcoal-400">
                  {cardCount} cards
                </span>
              </div>
            </div>
          );
        })()}

        {/* ─── Seat: LEFT ─────────────────────────────────────── */}
        {(() => {
          const item = seatPositions.find((sp) => sp.pos === 'left');
          if (!item) return null;
          const player = getPlayerAtSeat(item.seat);
          const isTurn = currentTurn === item.seat;
          const cardCount = player ? gameState.opponentCardCounts[player.id] || 0 : 0;
          const isTeamAC = SEAT_TEAM[item.seat] === TeamId.TeamAC;

          return (
            <div className="absolute left-3 sm:left-6 flex flex-col items-center z-10">
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 backdrop-blur-md border mb-2 ${
                  isTurn
                    ? 'bg-gold-500/20 border-gold-400 text-gold-300 ring-2 ring-gold-400/60 animate-pulse'
                    : 'bg-charcoal-900/80 border-charcoal-700 text-ivory-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isTeamAC ? 'bg-blue-400' : 'bg-amber-400'
                  }`}
                />
                <span>
                  {player ? player.name : `Seat ${SEAT_LABELS[item.seat]}`} (
                  {SEAT_LABELS[item.seat]})
                </span>
              </div>

              {/* Side Stack of Card Backs */}
              <div className="flex flex-col -space-y-12">
                {Array.from({ length: Math.min(cardCount, 5) }).map((_, i) => (
                  <CardBack key={i} size="sm" className="rotate-90" />
                ))}
              </div>
              <span className="text-[10px] text-charcoal-300 mt-2 font-mono">
                {cardCount} cards
              </span>
            </div>
          );
        })()}

        {/* ─── Seat: RIGHT ────────────────────────────────────── */}
        {(() => {
          const item = seatPositions.find((sp) => sp.pos === 'right');
          if (!item) return null;
          const player = getPlayerAtSeat(item.seat);
          const isTurn = currentTurn === item.seat;
          const cardCount = player ? gameState.opponentCardCounts[player.id] || 0 : 0;
          const isTeamAC = SEAT_TEAM[item.seat] === TeamId.TeamAC;

          return (
            <div className="absolute right-3 sm:right-6 flex flex-col items-center z-10">
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 backdrop-blur-md border mb-2 ${
                  isTurn
                    ? 'bg-gold-500/20 border-gold-400 text-gold-300 ring-2 ring-gold-400/60 animate-pulse'
                    : 'bg-charcoal-900/80 border-charcoal-700 text-ivory-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isTeamAC ? 'bg-blue-400' : 'bg-amber-400'
                  }`}
                />
                <span>
                  {player ? player.name : `Seat ${SEAT_LABELS[item.seat]}`} (
                  {SEAT_LABELS[item.seat]})
                </span>
              </div>

              {/* Side Stack of Card Backs */}
              <div className="flex flex-col -space-y-12">
                {Array.from({ length: Math.min(cardCount, 5) }).map((_, i) => (
                  <CardBack key={i} size="sm" className="-rotate-90" />
                ))}
              </div>
              <span className="text-[10px] text-charcoal-300 mt-2 font-mono">
                {cardCount} cards
              </span>
            </div>
          );
        })()}

        {/* ─── Center: TRICK ARENA (Played Cards) ─────────────── */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          {/* Subtle felt center circle */}
          <div className="absolute w-44 h-44 rounded-full border border-gold-500/20 bg-table-800/20 pointer-events-none" />

          {/* Lead Suit Indicator in center if trick active */}
          {leadSuit && (
            <div className="absolute text-center pointer-events-none opacity-40">
              <span className="text-xs uppercase tracking-widest text-gold-300 block font-semibold">
                Lead
              </span>
              <span
                className={`text-2xl font-bold ${
                  SUIT_COLORS[leadSuit] === 'red' ? 'text-red-400' : 'text-ivory-100'
                }`}
              >
                {SUIT_SYMBOLS[leadSuit]}
              </span>
            </div>
          )}

          {/* Display cards played in current trick */}
          {seatPositions.map((sp) => {
            const played = getPlayedCardAtSeat(sp.seat);
            if (!played) return null;

            const isTrump = trumpSuit !== null && played.card.suit === trumpSuit;
            const player = getPlayerAtSeat(sp.seat);
            const playerName = player?.name || `Seat ${SEAT_LABELS[sp.seat]}`;

            // Positional offset in center trick circle
            const positionStyles = {
              bottom: 'translate-y-10 sm:translate-y-12',
              top: '-translate-y-10 sm:-translate-y-12',
              left: '-translate-x-12 sm:-translate-x-14',
              right: 'translate-x-12 sm:translate-x-14',
            }[sp.pos];

            return (
              <div
                key={played.card.id}
                className={`absolute flex flex-col items-center transition-all duration-300 animate-fade-in ${positionStyles} z-20`}
              >
                <Card
                  card={played.card}
                  size="sm"
                  isTrump={isTrump}
                  className="shadow-xl"
                />
                <span className="text-[10px] font-medium text-ivory-200 bg-charcoal-900/80 px-2 py-0.5 rounded-full mt-1 border border-charcoal-700/60 shadow">
                  {playerName}
                </span>
              </div>
            );
          })}
        </div>

        {/* ─── Seat: BOTTOM Player Tag ────────────────────────── */}
        <div className="absolute bottom-2 sm:bottom-3 flex items-center gap-2 z-10">
          <div
            className={`px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-2 backdrop-blur-md border ${
              isMyTurn()
                ? 'bg-gold-500/20 border-gold-400 text-gold-300 ring-2 ring-gold-400/80 animate-pulse'
                : 'bg-charcoal-900/80 border-charcoal-700 text-ivory-200'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                SEAT_TEAM[mySeatIndex] === TeamId.TeamAC
                  ? 'bg-blue-400'
                  : 'bg-amber-400'
              }`}
            />
            <span>You (Seat {SEAT_LABELS[mySeatIndex]})</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-charcoal-700 text-charcoal-300">
              {TEAM_NAMES[SEAT_TEAM[mySeatIndex]]}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Bottom: Interactive Hand of Cards ───────────────── */}
      <div className="w-full mt-2">
        <Hand />
      </div>
    </div>
  );
};

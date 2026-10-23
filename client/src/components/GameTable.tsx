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
    <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-between min-h-[calc(100dvh-60px)] px-1 sm:px-4 py-1 sm:py-2 select-none overflow-hidden">
      {/* ─── Top Score & Trump HUD ───────────────────────────── */}
      <div className="w-full max-w-4xl glass-panel px-2.5 sm:px-4 py-1.5 sm:py-2.5 mb-1 sm:mb-2 flex items-center justify-between gap-1.5 sm:gap-3 border-gold-500/20 text-[11px] sm:text-xs md:text-sm">
        {/* Teams Score */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Team AC */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
            <span className="font-bold text-blue-400">AC:</span>
            <span className="font-mono font-black text-ivory-100 text-xs sm:text-base">
              {gameState.teamHandsWon[TeamId.TeamAC] || 0}
            </span>
          </div>

          <span className="text-charcoal-600 font-bold text-[10px] sm:text-xs">vs</span>

          {/* Team BD */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
            <span className="font-bold text-amber-400">BD:</span>
            <span className="font-mono font-black text-ivory-100 text-xs sm:text-base">
              {gameState.teamHandsWon[TeamId.TeamBD] || 0}
            </span>
          </div>
        </div>

        {/* Hand tracker */}
        <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-charcoal-800/80 border border-charcoal-700 font-medium text-charcoal-300 text-[10px] sm:text-xs shrink-0">
          Hand <strong className="text-ivory-100">{gameState.handNumber}</strong>/9
        </div>

        {/* Trump Badge */}
        {cuttDecision && (
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-gold-500/10 border border-gold-500/30 text-[10px] sm:text-xs shrink-0">
            <span className="text-charcoal-400 hidden xs:inline">Trump:</span>
            <span
              className={`font-black flex items-center gap-0.5 ${
                SUIT_COLORS[cuttDecision.suit] === 'red' ? 'text-red-500' : 'text-ivory-100'
              }`}
            >
              {SUIT_SYMBOLS[cuttDecision.suit]}
              <span className="uppercase text-[10px] sm:text-xs">{cuttDecision.suit}</span>
            </span>
            <span className="text-[9px] sm:text-[11px] px-1 py-0.2 rounded bg-gold-500/20 text-gold-300 font-mono">
              Target {cuttDecision.target}
            </span>
          </div>
        )}
      </div>

      {/* ─── Felt Green Poker Table ───────────────────────────── */}
      <div className="relative w-full max-w-4xl h-[330px] xs:h-[360px] sm:h-[420px] md:h-[480px] my-auto rounded-[36px] sm:rounded-[60px] md:rounded-[80px] bg-gradient-to-br from-emerald-800 via-table-600 to-table-900 border-[4px] sm:border-[8px] md:border-[12px] border-charcoal-800 shadow-2xl shadow-black/80 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {/* Felt Texture & Ring */}
        <div className="absolute inset-1.5 sm:inset-3 rounded-[28px] sm:rounded-[50px] md:rounded-[70px] border border-gold-500/20 pointer-events-none" />

        {/* Center Table Watermark Logo */}
        <div className="absolute flex flex-col items-center justify-center opacity-10 pointer-events-none">
          <span className="text-6xl sm:text-8xl md:text-9xl font-display font-black tracking-widest text-gold-400">
            ZUHAARI
          </span>
        </div>

        {/* Trick Winner Flash Toast in Center */}
        {handWinnerNotice && (
          <div className="absolute z-30 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-charcoal-950/95 border-2 border-gold-400 text-center shadow-2xl animate-fade-in backdrop-blur-md max-w-[90%]">
            <span className="text-gold-400 text-[10px] sm:text-xs uppercase tracking-widest font-bold block">
              Hand Won!
            </span>
            <p className="text-base sm:text-xl font-display font-black text-ivory-100 mt-0.5 truncate">
              🏆 {handWinnerNotice.winnerName}
            </p>
            <span className="text-[10px] sm:text-xs text-charcoal-300">
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
            <div className="absolute top-2 sm:top-4 flex flex-col items-center z-10">
              {/* Opponent Card Backs */}
              <div className="flex -space-x-6 sm:-space-x-8 mb-1">
                {Array.from({ length: Math.min(cardCount, 6) }).map((_, i) => (
                  <CardBack key={i} size="sm" />
                ))}
              </div>

              {/* Player Tag */}
              <div
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-2 backdrop-blur-md border ${
                  isTurn
                    ? 'bg-gold-500/20 border-gold-400 text-gold-300 ring-2 ring-gold-400/60 animate-pulse'
                    : 'bg-charcoal-900/80 border-charcoal-700 text-ivory-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    isTeamAC ? 'bg-blue-400' : 'bg-amber-400'
                  }`}
                />
                <span className="max-w-[80px] sm:max-w-[120px] truncate">
                  {player ? player.name : `Seat ${SEAT_LABELS[item.seat]}`} ({SEAT_LABELS[item.seat]})
                </span>
                <span className="text-[9px] text-charcoal-400 font-mono">
                  {cardCount}c
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
            <div className="absolute left-1.5 sm:left-4 flex flex-col items-center z-10">
              <div
                className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold flex items-center gap-1 backdrop-blur-md border mb-1 max-w-[70px] sm:max-w-[110px] ${
                  isTurn
                    ? 'bg-gold-500/20 border-gold-400 text-gold-300 ring-1 sm:ring-2 ring-gold-400/60 animate-pulse'
                    : 'bg-charcoal-900/80 border-charcoal-700 text-ivory-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isTeamAC ? 'bg-blue-400' : 'bg-amber-400'
                  }`}
                />
                <span className="truncate">
                  {player ? player.name : SEAT_LABELS[item.seat]}
                </span>
              </div>

              {/* Side Stack of Card Backs */}
              <div className="flex flex-col -space-y-8 sm:-space-y-11">
                {Array.from({ length: Math.min(cardCount, 4) }).map((_, i) => (
                  <CardBack key={i} size="sm" className="rotate-90" />
                ))}
              </div>
              <span className="text-[9px] text-charcoal-300 mt-1 font-mono">
                {cardCount}c
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
            <div className="absolute right-1.5 sm:right-4 flex flex-col items-center z-10">
              <div
                className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold flex items-center gap-1 backdrop-blur-md border mb-1 max-w-[70px] sm:max-w-[110px] ${
                  isTurn
                    ? 'bg-gold-500/20 border-gold-400 text-gold-300 ring-1 sm:ring-2 ring-gold-400/60 animate-pulse'
                    : 'bg-charcoal-900/80 border-charcoal-700 text-ivory-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isTeamAC ? 'bg-blue-400' : 'bg-amber-400'
                  }`}
                />
                <span className="truncate">
                  {player ? player.name : SEAT_LABELS[item.seat]}
                </span>
              </div>

              {/* Side Stack of Card Backs */}
              <div className="flex flex-col -space-y-8 sm:-space-y-11">
                {Array.from({ length: Math.min(cardCount, 4) }).map((_, i) => (
                  <CardBack key={i} size="sm" className="-rotate-90" />
                ))}
              </div>
              <span className="text-[9px] text-charcoal-300 mt-1 font-mono">
                {cardCount}c
              </span>
            </div>
          );
        })()}

        {/* ─── Center: TRICK ARENA (Played Cards) ─────────────── */}
        <div className="relative w-44 h-44 xs:w-48 xs:h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center">
          {/* Subtle felt center circle */}
          <div className="absolute w-28 h-28 xs:w-32 xs:h-32 sm:w-44 sm:h-44 rounded-full border border-gold-500/20 bg-table-800/20 pointer-events-none" />

          {/* Lead Suit Indicator in center if trick active */}
          {leadSuit && (
            <div className="absolute text-center pointer-events-none opacity-40">
              <span className="text-[9px] sm:text-xs uppercase tracking-widest text-gold-300 block font-semibold">
                Lead
              </span>
              <span
                className={`text-lg sm:text-2xl font-bold ${
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
              bottom: 'translate-y-7 sm:translate-y-10 md:translate-y-12',
              top: '-translate-y-7 sm:-translate-y-10 md:-translate-y-12',
              left: '-translate-x-8 sm:-translate-x-12 md:-translate-x-14',
              right: 'translate-x-8 sm:translate-x-12 md:translate-x-14',
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
                <span className="text-[9px] sm:text-[10px] font-medium text-ivory-200 bg-charcoal-900/90 px-1.5 sm:px-2 py-0.2 rounded-full mt-0.5 border border-charcoal-700/60 shadow max-w-[70px] sm:max-w-[90px] truncate">
                  {playerName}
                </span>
              </div>
            );
          })}
        </div>

        {/* ─── Seat: BOTTOM Player Tag ────────────────────────── */}
        <div className="absolute bottom-1.5 sm:bottom-3 flex items-center gap-1.5 z-10">
          <div
            className={`px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md border ${
              isMyTurn()
                ? 'bg-gold-500/20 border-gold-400 text-gold-300 ring-2 ring-gold-400/80 animate-pulse'
                : 'bg-charcoal-900/80 border-charcoal-700 text-ivory-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                SEAT_TEAM[mySeatIndex] === TeamId.TeamAC
                  ? 'bg-blue-400'
                  : 'bg-amber-400'
              }`}
            />
            <span>You (Seat {SEAT_LABELS[mySeatIndex]})</span>
          </div>
        </div>
      </div>

      {/* ─── Bottom: Interactive Hand of Cards ───────────────── */}
      <div className="w-full mt-1 sm:mt-2">
        <Hand />
      </div>
    </div>
  );
};

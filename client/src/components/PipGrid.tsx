import React from 'react';
import { Rank, Suit } from '@shared/constants';
import { SuitIcon } from './SuitIcon';

interface PipGridProps {
  rank: Rank;
  suit: Suit;
  pipSize?: number;
}

interface PipPosition {
  x: number; // percentage 0 to 100
  y: number; // percentage 0 to 100
  inverted?: boolean;
}

export const PipGrid: React.FC<PipGridProps> = ({ rank, suit, pipSize = 14 }) => {
  const getPositions = (): PipPosition[] => {
    switch (rank) {
      case Rank.Six:
        return [
          { x: 25, y: 20 },
          { x: 75, y: 20 },
          { x: 25, y: 50 },
          { x: 75, y: 50 },
          { x: 25, y: 80, inverted: true },
          { x: 75, y: 80, inverted: true },
        ];

      case Rank.Seven:
        return [
          { x: 25, y: 20 },
          { x: 75, y: 20 },
          { x: 50, y: 35 },
          { x: 25, y: 50 },
          { x: 75, y: 50 },
          { x: 25, y: 80, inverted: true },
          { x: 75, y: 80, inverted: true },
        ];

      case Rank.Eight:
        return [
          { x: 25, y: 20 },
          { x: 75, y: 20 },
          { x: 50, y: 35 },
          { x: 25, y: 50 },
          { x: 75, y: 50 },
          { x: 50, y: 65, inverted: true },
          { x: 25, y: 80, inverted: true },
          { x: 75, y: 80, inverted: true },
        ];

      case Rank.Nine:
        return [
          { x: 25, y: 18 },
          { x: 75, y: 18 },
          { x: 25, y: 39 },
          { x: 75, y: 39 },
          { x: 50, y: 50 },
          { x: 25, y: 61, inverted: true },
          { x: 75, y: 61, inverted: true },
          { x: 25, y: 82, inverted: true },
          { x: 75, y: 82, inverted: true },
        ];

      case Rank.Ten:
        return [
          { x: 25, y: 18 },
          { x: 75, y: 18 },
          { x: 50, y: 28 },
          { x: 25, y: 39 },
          { x: 75, y: 39 },
          { x: 25, y: 61, inverted: true },
          { x: 75, y: 61, inverted: true },
          { x: 50, y: 72, inverted: true },
          { x: 25, y: 82, inverted: true },
          { x: 75, y: 82, inverted: true },
        ];

      default:
        return [];
    }
  };

  const positions = getPositions();

  return (
    <div className="relative w-full h-full select-none pointer-events-none">
      {positions.map((p, idx) => (
        <div
          key={idx}
          className="absolute -translate-x-1/2 -translate-y-1/2 leading-none"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <SuitIcon
            suit={suit}
            size={pipSize}
            inverted={p.inverted}
            className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]"
          />
        </div>
      ))}
    </div>
  );
};

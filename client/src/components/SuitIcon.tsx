import React from 'react';
import { Suit } from '@shared/constants';

interface SuitIconProps {
  suit: Suit;
  className?: string;
  size?: number;
  inverted?: boolean;
}

export const SuitIcon: React.FC<SuitIconProps> = ({
  suit,
  className = '',
  size = 18,
  inverted = false,
}) => {
  const isRed = suit === Suit.Hearts || suit === Suit.Diamonds;
  const fillColor = isRed ? '#dc2626' : '#171717';

  // SVG viewBox is 0 0 24 24
  const renderPath = () => {
    switch (suit) {
      case Suit.Spades:
        return (
          <path
            fill={fillColor}
            d="M12 2.5C10.8 4.2 4.5 11.2 4.5 15.2C4.5 18.2 7 20 9.8 20C11 20 11.8 19.3 12 18.6C12.2 19.3 13 20 14.2 20C17 20 19.5 18.2 19.5 15.2C19.5 11.2 13.2 4.2 12 2.5ZM11.3 18.8L9.8 22.5H14.2L12.7 18.8C12.4 18.9 12.2 18.9 12 18.9C11.8 18.9 11.6 18.9 11.3 18.8Z"
          />
        );

      case Suit.Hearts:
        return (
          <path
            fill={fillColor}
            d="M12 21.3C11.5 20.8 3.5 14.2 3.5 8.7C3.5 5.2 6 2.7 9.5 2.7C10.7 2.7 11.7 3.2 12 3.8C12.3 3.2 13.3 2.7 14.5 2.7C18 2.7 20.5 5.2 20.5 8.7C20.5 14.2 12.5 20.8 12 21.3Z"
          />
        );

      case Suit.Diamonds:
        return (
          <path
            fill={fillColor}
            d="M12 2.2L20.2 12L12 21.8L3.8 12L12 2.2Z"
          />
        );

      case Suit.Clubs:
        return (
          <path
            fill={fillColor}
            d="M12 2.5C10.2 2.5 8.7 4 8.7 5.8C8.7 6.6 9 7.4 9.5 8C8.7 8.2 5.5 8.8 5.5 12C5.5 14.2 7.3 16 9.5 16C10.6 16 11.4 15.5 11.9 14.8C11.8 15.6 10.8 19 9.8 22.5H14.2C13.2 19 12.2 15.6 12.1 14.8C12.6 15.5 13.4 16 14.5 16C16.7 16 18.5 14.2 18.5 12C18.5 8.8 15.3 8.2 14.5 8C15 7.4 15.3 6.6 15.3 5.8C15.3 4 13.8 2.5 12 2.5Z"
          />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${inverted ? 'rotate-180' : ''} ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {renderPath()}
    </svg>
  );
};

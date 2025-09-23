import React from 'react';
import { Card as CardType, Suit } from '../types';

interface CardProps {
  card: CardType | null;
  isFaceDown?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, isFaceDown = false, onClick, isSelected, className }) => {
  const color = card && (card.suit === Suit.Hearts || card.suit === Suit.Diamonds) ? 'text-red-500' : 'text-black';

  const baseClasses = 'w-14 h-20 md:w-16 md:h-24 rounded-lg shadow-md flex items-center justify-center transition-all duration-300 ease-in-out transform';
  const selectedClasses = isSelected ? 'ring-4 ring-cyan-400 -translate-y-2' : 'hover:-translate-y-1';
  const clickableClasses = onClick ? `cursor-pointer ${selectedClasses}` : '';

  if (isFaceDown) {
    return (
      <div className={`${baseClasses} bg-slate-800 border-2 border-slate-600 p-1.5 ${className}`}>
          <div className="w-full h-full rounded-md bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-700 via-slate-800 to-slate-900 flex items-center justify-center border border-indigo-500/30">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-cyan-500 transform rotate-45 rounded-sm shadow-[0_0_12px_theme(colors.cyan.400)] opacity-80"></div>
          </div>
      </div>
    );
  }

  if (!card) {
    return <div className={`${baseClasses} bg-slate-800 border-2 border-slate-700 ${className}`} />;
  }

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} bg-white ${color} relative p-1 text-xl font-bold border border-gray-300 ${clickableClasses} ${className}`}
    >
      <div className="absolute top-1 left-1.5">{card.rank}</div>
      <div className="absolute top-6 left-1.5 text-base">{card.suit}</div>
      <div className="text-3xl">{card.suit}</div>
      <div className="absolute bottom-1 right-1.5 transform rotate-180">{card.rank}</div>
      <div className="absolute bottom-6 right-1.5 text-base transform rotate-180">{card.suit}</div>
    </div>
  );
};

export default Card;

import React from 'react';
import { Rank } from '../types';
import { RANKS } from '../constants';

interface BookDisplayProps {
  books: Rank[];
  isOpponent?: boolean;
  highlightedRank?: Rank | null;
}

const BookDisplay: React.FC<BookDisplayProps> = ({ books, isOpponent = false, highlightedRank = null }) => {
  if (books.length === 0) {
    // Return a placeholder to maintain layout consistency
    return <div className={isOpponent ? 'h-7' : 'h-14'} />;
  }

  // Sort books by rank order for consistent display
  const sortedBooks = [...books].sort((a, b) => RANKS.indexOf(a) - RANKS.indexOf(b));

  const cardSize = isOpponent ? 'w-4 h-6 text-[9px]' : 'w-8 h-12 text-sm';
  const containerHeight = isOpponent ? 'h-7' : 'h-14';
  const overlap = isOpponent ? '-space-x-2.5' : '-space-x-5';

  return (
    <div className={`flex justify-center items-center ${containerHeight} w-full`}>
        <div className={`flex items-center ${overlap}`}>
            {sortedBooks.map((rank) => {
                const isHighlighted = rank === highlightedRank;
                return (
                    <div
                        key={rank}
                        className={`flex items-center justify-center font-bold bg-white text-slate-800 rounded-sm border border-gray-400 shadow-sm transition-all duration-500 ease-in-out ${cardSize} ${isHighlighted ? 'scale-125 shadow-lg shadow-yellow-400/50 ring-2 ring-yellow-300 z-10' : ''}`}
                        title={`Book of ${rank}s`}
                    >
                        {rank}
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default BookDisplay;
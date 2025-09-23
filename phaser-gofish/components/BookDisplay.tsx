import React from 'react';
import { Rank } from '../types';
import { RANKS } from '../constants';

interface BookDisplayProps {
  books: Rank[];
  isOpponent?: boolean;
}

const BookDisplay: React.FC<BookDisplayProps> = ({ books, isOpponent = false }) => {
  if (books.length === 0) {
    // Return a placeholder to maintain layout consistency
    return <div className={isOpponent ? 'h-8' : 'h-14'} />;
  }

  // Sort books by rank order for consistent display
  const sortedBooks = [...books].sort((a, b) => RANKS.indexOf(a) - RANKS.indexOf(b));

  const cardSize = isOpponent ? 'w-5 h-7 text-[10px]' : 'w-8 h-12 text-sm';
  const containerHeight = isOpponent ? 'h-8' : 'h-14';
  const overlap = isOpponent ? '-space-x-3' : '-space-x-5';

  return (
    <div className={`flex justify-center items-center ${containerHeight} w-full`}>
        <div className={`flex items-center ${overlap}`}>
            {sortedBooks.map((rank) => (
                <div
                    key={rank}
                    className={`flex items-center justify-center font-bold bg-white text-slate-800 rounded-sm border border-gray-400 shadow-sm ${cardSize}`}
                    title={`Book of ${rank}s`}
                >
                    {rank}
                </div>
            ))}
        </div>
    </div>
  );
};

export default BookDisplay;

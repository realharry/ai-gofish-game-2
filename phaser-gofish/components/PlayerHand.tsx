import React from 'react';
import { Card as CardType, Player, Rank } from '../types';
import Card from './Card';
import { RANKS } from '../constants';

interface PlayerHandProps {
  player: Player;
  isCurrentUser: boolean;
  onCardRankSelect?: (rank: Rank) => void;
  selectedRank?: Rank | null;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ player, isCurrentUser, onCardRankSelect, selectedRank }) => {
  const sortedHand = [...player.hand].sort((a, b) => {
    const rankAIndex = RANKS.indexOf(a.rank);
    const rankBIndex = RANKS.indexOf(b.rank);
    if (rankAIndex === rankBIndex) {
        return a.suit.localeCompare(b.suit);
    }
    return rankAIndex - rankBIndex;
  });
  
  if (isCurrentUser) {
    // New single-row layout for the current user's hand
    return (
      <div className="flex justify-center items-end p-1 bg-black/20 rounded-lg w-full overflow-x-auto min-h-[100px]">
        <div className="flex -space-x-9 md:-space-x-10">
          {sortedHand.map((card) => (
            <Card
              key={`${card.rank}-${card.suit}`}
              card={card}
              onClick={() => onCardRankSelect && onCardRankSelect(card.rank)}
              isSelected={selectedRank === card.rank}
              className="hover:z-10"
            />
          ))}
        </div>
      </div>
    );
  }

  // AI player hands remain unchanged
  return (
    <div className="flex justify-center items-center h-24 space-x-[-50px] md:space-x-[-56px]">
      {player.hand.map((_, index) => (
        <Card key={index} card={null} isFaceDown />
      ))}
    </div>
  );
};

export default PlayerHand;
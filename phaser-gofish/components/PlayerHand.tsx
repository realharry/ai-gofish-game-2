
import React from 'react';
import { Card as CardType, Player, Rank } from '../types';
import Card from './Card';

interface PlayerHandProps {
  player: Player;
  isCurrentUser: boolean;
  onCardRankSelect?: (rank: Rank) => void;
  selectedRank?: Rank | null;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ player, isCurrentUser, onCardRankSelect, selectedRank }) => {
  const sortedHand = [...player.hand].sort((a, b) => a.rank.localeCompare(b.rank));
  
  if (isCurrentUser) {
    const ranks = [...new Set(sortedHand.map(c => c.rank))];
    const cardsByRank: {[key in Rank]?: CardType[]} = {};
    sortedHand.forEach(card => {
        if(!cardsByRank[card.rank]){
            cardsByRank[card.rank] = [];
        }
        cardsByRank[card.rank]!.push(card);
    });

    return (
      <div className="flex flex-col items-center space-y-2">
         <div className="flex justify-center flex-wrap gap-2 p-2 bg-black/20 rounded-lg">
          {ranks.map(rank => (
            <div key={rank} className="relative cursor-pointer" onClick={() => onCardRankSelect && onCardRankSelect(rank)}>
              {cardsByRank[rank]!.map((card, index) => (
                <Card 
                  key={`${card.rank}-${card.suit}`}
                  card={card}
                  isSelected={selectedRank === rank}
                  className="absolute"
                  style={{ left: `${index * 15}px`, zIndex: index }}
                />
              ))}
              <div style={{width: `${(cardsByRank[rank]!.length-1) * 15 + 80}px`, height: '112px'}} className="opacity-0"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-28 space-x-[-40px]">
      {player.hand.map((_, index) => (
        <Card key={index} card={null} isFaceDown />
      ))}
    </div>
  );
};

export default PlayerHand;

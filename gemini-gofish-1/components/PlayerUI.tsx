import React, { useState } from 'react';
// FIX: Import 'Suit' type to resolve reference error in the unused 'Card' component definition. Removed unused 'AIType'.
import { Player, Rank, Suit } from '../types';
import { AskDialog } from './ui/Dialog';
import { useSound } from '../hooks/useSound';
import { clickSfx } from '../assets/sounds';

interface PlayerUIProps {
  player: Player;
  opponents: Player[];
  onAsk: (targetId: number, rank: Rank) => void;
  isCurrent: boolean;
  phase: string;
}

const Card: React.FC<{ rank: Rank; suit: Suit; isSelected: boolean; onClick: () => void; disabled: boolean }> = ({ rank, suit, isSelected, onClick, disabled }) => {
    const color = (suit === '♥' || suit === '♦') ? 'text-red-500' : 'text-slate-200';
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`w-16 h-24 bg-slate-700 border-2 rounded-md flex flex-col justify-between p-1 transition-all duration-200 transform hover:-translate-y-2 ${isSelected ? 'border-cyan-400 -translate-y-4' : 'border-slate-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <span className={`text-xl font-bold ${color}`}>{rank}</span>
            <span className={`text-2xl ${color}`}>{suit}</span>
        </button>
    );
}

export const PlayerUI: React.FC<PlayerUIProps> = ({ player, opponents, onAsk, isCurrent, phase }) => {
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const playClickSound = useSound(clickSfx, 0.5);

  const uniqueRanksInHand = [...new Set(player.hand.map(card => card.rank))];
  const sortedHand = [...player.hand].sort((a, b) => a.rank.localeCompare(b.rank));

  const handleCardClick = (rank: Rank) => {
    if (isCurrent && phase === 'PLAYER_TURN') {
      playClickSound();
      setSelectedRank(rank);
      setIsAskModalOpen(true);
    }
  };

  const handleAskSubmit = (targetId: number) => {
    if (selectedRank) {
      onAsk(targetId, selectedRank);
      setIsAskModalOpen(false);
      setSelectedRank(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <AskDialog 
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        opponents={opponents}
        onSelectOpponent={handleAskSubmit}
        rank={selectedRank}
      />
      <div className="flex items-center gap-3 mb-2">
        <img src={player.avatarUrl} alt="Your avatar" className="w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-500" />
        <h2 className={`text-xl font-bold ${isCurrent ? 'text-cyan-400' : ''}`}>{player.name}</h2>
      </div>
      <div className={`flex gap-2 justify-center flex-wrap p-2 bg-slate-800/50 rounded-lg transition-all duration-300 ${isCurrent && phase === 'PLAYER_TURN' ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-500/20' : 'border-2 border-transparent'}`}>
        {sortedHand.length > 0 ? sortedHand.map((card, i) => (
          <button
            key={`${card.id}-${i}`}
            onClick={() => handleCardClick(card.rank)}
            disabled={!isCurrent || phase !== 'PLAYER_TURN'}
            className={`w-16 h-24 bg-slate-700 border-2 border-slate-600 rounded-md flex flex-col justify-between p-1 transition-all duration-200 transform hover:-translate-y-2 focus:border-cyan-400 focus:-translate-y-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
           >
             <span className={`text-xl font-bold ${card.suit === '♥' || card.suit === '♦' ? 'text-red-400' : 'text-slate-200'}`}>{card.rank}</span>
             <span className={`text-2xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-400' : 'text-slate-200'}`}>{card.suit}</span>
           </button>
        )) : <p className="text-slate-400 p-8">You have no cards.</p>}
      </div>
    </div>
  );
};
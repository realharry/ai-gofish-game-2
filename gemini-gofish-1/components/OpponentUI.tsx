import React from 'react';
import { Player } from '../types';

interface OpponentUIProps {
  player: Player;
  isCurrent: boolean;
}

// Array of card back styles to visually distinguish opponents
const cardBackStyles = [
  'bg-cyan-800 border-cyan-500',      // Style for player ID 1
  'bg-purple-800 border-purple-500',  // Style for player ID 2
  'bg-emerald-800 border-emerald-500',// Style for player ID 3
];

const FaceDownCard: React.FC<{ playerId: number }> = ({ playerId }) => {
    // Select style based on player ID. Subtract 1 because AI IDs are 1, 2, 3.
    // Use modulo to safely wrap around if more players are ever added.
    const style = cardBackStyles[(playerId - 1) % cardBackStyles.length];
    return <div className={`w-8 h-12 ${style} border-2 rounded-md`}></div>
}

export const OpponentUI: React.FC<OpponentUIProps> = ({ player, isCurrent }) => {
  return (
    <div className={`p-4 rounded-lg border-2 ${isCurrent ? 'border-cyan-400 bg-cyan-900/50 shadow-lg shadow-cyan-500/30' : 'border-slate-700 bg-slate-800/50'} w-48 transition-all duration-300 flex flex-col items-center`}>
      <div className="flex items-center gap-2 mb-2">
        <img src={player.avatarUrl} alt={`${player.name}'s avatar`} className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-500" />
        <h3 className={`font-bold text-center ${isCurrent ? 'text-cyan-300' : 'text-slate-300'}`}>{player.name} ({player.aiType})</h3>
      </div>
      <div className="flex justify-center items-center gap-2 mt-2">
        <div className="text-lg font-mono">{player.hand.length}</div>
        <FaceDownCard playerId={player.id} />
      </div>
    </div>
  );
};

import React from 'react';
import { Player } from '../types';

interface ScoreboardProps {
  players: Player[];
  currentPlayerId: string;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ players, currentPlayerId }) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 shadow-inner">
      <h3 className="text-center font-bold text-cyan-300 mb-2">Scoreboard</h3>
      <ul className="space-y-1">
        {players.map(player => (
          <li
            key={player.id}
            className={`flex justify-between items-center text-sm p-1 rounded transition-colors duration-300 ${
              player.id === currentPlayerId ? 'bg-cyan-500/30 text-white' : 'text-slate-300'
            }`}
          >
            <span className="font-semibold">{player.name}</span>
            <span>{player.books.length} Books</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scoreboard;

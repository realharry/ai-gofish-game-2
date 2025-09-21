import React from 'react';
import { Player } from '../types';

interface ScoreboardProps {
  players: Player[];
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ players }) => {
  const maxScore = Math.max(...players.map(p => p.books.length), 0);
    
  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 w-48">
      <h4 className="font-bold text-slate-300 text-center border-b border-slate-600 pb-2 mb-2">Scoreboard</h4>
      <ul className="space-y-2">
        {players.map(player => (
          <li key={player.id} className="flex justify-between items-center text-slate-300">
            <div className="flex items-center gap-2">
                <img src={player.avatarUrl} alt={`${player.name}'s avatar`} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-600" />
                <div className="flex-1">
                  <span>{player.name}</span>
                   <div className="text-xs text-slate-400 h-4"> {/* Fixed height to prevent layout shift */}
                    {player.stats?.winStreak > 0 && <span className="mr-2">🔥 {player.stats.winStreak}</span>}
                    {player.stats?.lossStreak > 0 && <span>💀 {player.stats.lossStreak}</span>}
                  </div>
                </div>
            </div>
            <span className="flex items-center gap-2 font-bold">
              {player.books.length}
              {maxScore > 0 && player.books.length === maxScore && (
                <span role="img" aria-label="leader" className="text-yellow-400">🏆</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
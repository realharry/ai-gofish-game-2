import React, { useState, useEffect } from 'react';
import { Player } from '../types';

interface GameOverModalProps {
  winner: Player | null;
  players: Player[];
  onPlayAgain: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ winner, players, onPlayAgain }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  const sortedPlayers = [...players].sort((a, b) => b.books.length - a.books.length);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm text-center border-2 border-cyan-400 transition-all duration-300 ease-out"
        style={{
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
          opacity: visible ? 1 : 0,
        }}
      >
        <h2 className="text-4xl font-bold text-cyan-300 mb-2">Game Over</h2>
        <p className="text-xl text-white mb-4">
          {winner ? `${winner.name} wins!` : "It's a tie!"}
        </p>

        <div className="bg-slate-900/50 rounded-lg p-3 mb-6">
            <h3 className="text-lg font-bold text-cyan-300 mb-2">Final Scores</h3>
            <ul className="space-y-1 text-left">
                {sortedPlayers.map((player, index) => (
                    <li key={player.id} className="flex justify-between items-center text-sm p-1.5 rounded bg-slate-800/50">
                        <span className="font-semibold text-slate-200">
                            {index + 1}. {player.name}
                        </span>
                        <span className="text-slate-300">{player.books.length} Books</span>
                    </li>
                ))}
            </ul>
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded text-lg transition-transform duration-300 transform hover:scale-105"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
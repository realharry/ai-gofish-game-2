
import React, { useState, useEffect } from 'react';
import { Player } from '../types';

interface GameOverModalProps {
  winner: Player | null;
  onPlayAgain: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ winner, onPlayAgain }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-sm text-center border-2 border-cyan-400 transition-all duration-300 ease-out"
        style={{
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
          opacity: visible ? 1 : 0,
        }}
      >
        <h2 className="text-4xl font-bold text-cyan-300 mb-4">Game Over</h2>
        <p className="text-xl text-white mb-6">
          {winner ? `${winner.name} wins the game!` : "It's a tie!"}
        </p>
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

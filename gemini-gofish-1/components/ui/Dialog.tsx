import React, { useState, useEffect } from 'react';
import { Player, Rank } from '../../types';
import { useSound } from '../../hooks/useSound';
import { clickSfx } from '../../assets/sounds';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, showCloseButton = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-cyan-400">{title}</h2>
          {showCloseButton && (
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

interface AskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    opponents: Player[];
    onSelectOpponent: (targetId: number) => void;
    rank: Rank | null;
}

export const AskDialog: React.FC<AskDialogProps> = ({ isOpen, onClose, opponents, onSelectOpponent, rank }) => {
    const playClickSound = useSound(clickSfx, 0.5);
    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={`Ask for ${rank}s`}>
            <p className="text-slate-300 mb-4">Who do you want to ask?</p>
            <div className="grid grid-cols-1 gap-3">
                {opponents.map(opponent => (
                    <button
                        key={opponent.id}
                        onClick={() => {
                            playClickSound();
                            onSelectOpponent(opponent.id);
                        }}
                        disabled={opponent.hand.length === 0}
                        className="w-full text-left p-3 bg-slate-700 rounded-md hover:bg-cyan-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="font-bold">{opponent.name}</span>
                        <span className="text-sm text-slate-400 ml-2">({opponent.hand.length} cards)</span>
                    </button>
                ))}
            </div>
        </Dialog>
    );
};

interface GameOverDialogProps {
    winner: Player | null;
    onRestart: () => void;
}

export const GameOverDialog: React.FC<GameOverDialogProps> = ({ winner, onRestart }) => {
    const playClickSound = useSound(clickSfx, 0.5);
    return (
        <Dialog isOpen={true} onClose={() => {}} title="Game Over!" showCloseButton={false}>
            <div className="text-center flex flex-col items-center">
                {winner && (
                    <img src={winner.avatarUrl} alt={`${winner.name}'s avatar`} className="w-24 h-24 rounded-full bg-slate-700 border-4 border-yellow-400 mb-4 shadow-lg" />
                )}
                <p className="text-xl text-slate-200 mb-4">
                    {winner ? `${winner.name} wins the game!` : "It's a tie!"}
                </p>
                <button
                    onClick={() => {
                        playClickSound();
                        onRestart();
                    }}
                    className="px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-lg hover:bg-cyan-400 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30"
                >
                    Play Again
                </button>
            </div>
        </Dialog>
    );
};

interface ToastProps {
  message: string;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in when mounted
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}
    >
      <div className="bg-cyan-500 text-slate-900 font-bold px-6 py-3 rounded-lg shadow-lg shadow-cyan-500/30">
        {message}
      </div>
    </div>
  );
};
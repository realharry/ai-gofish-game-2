import React from 'react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-cyan-500 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-cyan-300 mb-4 text-center">How to Play Go Fish</h2>
        
        <div className="space-y-4 text-slate-300 pr-4">
            <div>
                <h3 className="font-semibold text-lg text-cyan-400">Objective</h3>
                <p>The goal is to collect the most "books". A book is a set of four cards of the same rank (e.g., four Kings).</p>
            </div>
            <div>
                <h3 className="font-semibold text-lg text-cyan-400">Setup</h3>
                <p>The game is played with a standard 52-card deck. Each of the four players starts with 5 cards. The remaining cards are placed face down to form the draw pile (the "fish pond").</p>
            </div>
            <div>
                <h3 className="font-semibold text-lg text-cyan-400">Your Turn</h3>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <li>
                        <strong>Ask for a card:</strong> Start by selecting a rank from your hand (e.g., '8'). Then, choose an opponent to ask if they have any cards of that rank. You must have at least one card of the rank you are asking for.
                    </li>
                    <li>
                        <strong>If they have it:</strong> The opponent must give you all cards of that rank. You get another turn.
                    </li>
                    <li>
                        <strong>If they don't ("Go Fish"):</strong> The opponent will say "Go Fish!". You must draw one card from the deck.
                    </li>
                    <li>
                        <strong>Lucky Draw:</strong> If the card you draw is the rank you asked for, you show it to everyone and get another turn. Otherwise, your turn ends, and the next player goes.
                    </li>
                </ol>
            </div>
            <div>
                <h3 className="font-semibold text-lg text-cyan-400">Making Books</h3>
                <p>When you collect all four cards of the same rank, you have completed a book. The book is automatically removed from your hand and added to your score.</p>
            </div>
            <div>
                <h3 className="font-semibold text-lg text-cyan-400">Winning the Game</h3>
                <p>The game ends when all 13 books have been collected or when a player runs out of cards. The player with the most books at the end of the game is the winner!</p>
            </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default InstructionsModal;
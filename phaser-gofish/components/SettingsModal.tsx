import React from 'react';
import { Player, AIModel, GameSpeed, CardBack } from '../types';

interface CardBackPreviewProps {
  cardBack: CardBack;
  isSelected: boolean;
  onClick: () => void;
}

const CardBackPreview: React.FC<CardBackPreviewProps> = ({ cardBack, isSelected, onClick }) => {
    let style = '';
    let content = null;
    switch(cardBack) {
        case CardBack.Galaxy:
            style = 'bg-gradient-to-tr from-indigo-900 via-purple-900 to-black border-purple-500/50';
            content = <div className="text-white text-xs opacity-50">✨</div>;
            break;
        case CardBack.Forest:
            style = 'bg-gradient-to-br from-green-800 to-emerald-900 border-green-500/50';
            content = <div className="text-white text-lg opacity-50">🌲</div>;
            break;
        case CardBack.Ocean:
            style = 'bg-gradient-to-tl from-blue-700 via-cyan-600 to-teal-800 border-cyan-500/50';
            content = <div className="text-white text-lg opacity-50">🌊</div>;
            break;
        case CardBack.Default:
        default:
            style = 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-700 via-slate-800 to-slate-900 border-indigo-500/50';
            content = <div className="w-3 h-3 bg-cyan-500 transform rotate-45 rounded-sm shadow-[0_0_8px_theme(colors.cyan.400)] opacity-80"></div>;
            break;
    }

    return (
        <div className="flex flex-col items-center space-y-1">
            <button
                onClick={onClick}
                className={`w-16 h-24 rounded-lg flex items-center justify-center border-2 transition-all duration-200 ${style} ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-cyan-400' : 'border-transparent'}`}
            >
                {content}
            </button>
            <p className={`text-xs ${isSelected ? 'text-cyan-300 font-semibold' : 'text-slate-400'}`}>{cardBack}</p>
        </div>
    );
};


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onModelChange: (playerId: string, model: AIModel) => void;
  gameSpeed: GameSpeed;
  onGameSpeedChange: (speed: GameSpeed) => void;
  cardBack: CardBack;
  onCardBackChange: (back: CardBack) => void;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, players, onModelChange, gameSpeed, onGameSpeedChange, cardBack, onCardBackChange, playerName, onPlayerNameChange }) => {
  if (!isOpen) return null;

  const aiPlayers = players.filter(p => p.isAI);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm border border-cyan-500 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-cyan-300 mb-6 text-center">Settings</h2>
        
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Your Name</h3>
            <input
                type="text"
                value={playerName}
                onChange={(e) => onPlayerNameChange(e.target.value)}
                className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                placeholder="Enter your name"
                maxLength={20}
            />
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Game Speed</h3>
            <div className="flex justify-between space-x-2">
                {Object.values(GameSpeed).map(speed => (
                    <button
                        key={speed}
                        onClick={() => onGameSpeedChange(speed)}
                        className={`w-full py-2 text-sm font-bold rounded-lg transition-colors duration-200 border-2 ${
                            gameSpeed === speed 
                            ? 'bg-cyan-500 border-cyan-400 text-white' 
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {speed}
                    </button>
                ))}
            </div>
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">Card Back Design</h3>
            <div className="flex justify-around items-start">
                {Object.values(CardBack).map(back => (
                    <CardBackPreview 
                        key={back} 
                        cardBack={back} 
                        isSelected={cardBack === back} 
                        onClick={() => onCardBackChange(back)} 
                    />
                ))}
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-slate-300 mb-4">AI Models</h3>
            <div className="space-y-4">
            {aiPlayers.map(player => (
                <div key={player.id}>
                <label htmlFor={`model-${player.id}`} className="block text-md text-slate-300 mb-1">{player.name}</label>
                <select
                    id={`model-${player.id}`}
                    value={player.aiModel}
                    onChange={(e) => onModelChange(player.id, e.target.value as AIModel)}
                    className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                >
                    {Object.values(AIModel).map(model => (
                    <option key={model} value={model}>{model}</option>
                    ))}
                </select>
                </div>
            ))}
            </div>
        </div>
        
        <button
          onClick={onClose}
          className="mt-8 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;

import React from 'react';
import { Player, AIModel, GameSpeed } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onModelChange: (playerId: string, model: AIModel) => void;
  gameSpeed: GameSpeed;
  onGameSpeedChange: (speed: GameSpeed) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, players, onModelChange, gameSpeed, onGameSpeedChange }) => {
  if (!isOpen) return null;

  const aiPlayers = players.filter(p => p.isAI);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm border border-cyan-500">
        <h2 className="text-2xl font-bold text-cyan-300 mb-6 text-center">Settings</h2>
        
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

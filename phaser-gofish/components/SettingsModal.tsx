
import React from 'react';
import { Player, AIModel } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onModelChange: (playerId: string, model: AIModel) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, players, onModelChange }) => {
  if (!isOpen) return null;

  const aiPlayers = players.filter(p => p.isAI);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm border border-cyan-500">
        <h2 className="text-2xl font-bold text-cyan-300 mb-4 text-center">AI Settings</h2>
        <div className="space-y-4">
          {aiPlayers.map(player => (
            <div key={player.id}>
              <label htmlFor={`model-${player.id}`} className="block text-lg font-semibold text-slate-300 mb-1">{player.name}</label>
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
        <button
          onClick={onClose}
          className="mt-6 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;

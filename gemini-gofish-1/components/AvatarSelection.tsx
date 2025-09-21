import React, { useState } from 'react';
import { useSound } from '../hooks/useSound';
import { clickSfx } from '../assets/sounds';

const AVATAR_SEEDS = [' মানব', 'প্রানী', 'মাছ', 'টেক্কা']; // Using non-latin strings for unique seeds
const AVATAR_API_URL = 'https://api.dicebear.com/8.x/adventurer/svg?seed=';

interface AvatarSelectionProps {
  onStartGame: (avatarUrl: string, playerName: string) => void;
}

export const AvatarSelection: React.FC<AvatarSelectionProps> = ({ onStartGame }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const playClickSound = useSound(clickSfx, 0.5);

  const handleSelectAvatar = (url: string) => {
    playClickSound();
    setSelectedAvatar(url);
  };

  const handleStartGame = () => {
    playClickSound();
    
    // Default to "You" if no name is entered
    const finalPlayerName = playerName.trim() || 'You';
    
    // Default to a random avatar if none is selected
    let finalAvatarUrl = selectedAvatar;
    if (!finalAvatarUrl) {
      const randomIndex = Math.floor(Math.random() * AVATAR_SEEDS.length);
      const randomSeed = AVATAR_SEEDS[randomIndex];
      finalAvatarUrl = `${AVATAR_API_URL}${encodeURIComponent(randomSeed)}`;
    }
    
    onStartGame(finalAvatarUrl, finalPlayerName);
  };

  return (
    <div className="text-center p-8 bg-slate-800/50 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg">
      <h2 className="text-3xl font-bold text-cyan-400 mb-2">Personalize Your Game</h2>
      <p className="text-slate-400 mb-6">Selections are optional. Press Start to play as a guest!</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        {AVATAR_SEEDS.map(seed => {
          const avatarUrl = `${AVATAR_API_URL}${encodeURIComponent(seed)}`;
          const isSelected = selectedAvatar === avatarUrl;
          return (
            <button
              key={seed}
              onClick={() => handleSelectAvatar(avatarUrl)}
              className={`p-2 bg-slate-700 rounded-full transition-all transform hover:scale-110 focus:outline-none ${isSelected ? 'ring-4 ring-cyan-500 scale-110' : 'ring-4 ring-transparent'}`}
              aria-label={`Select avatar ${seed}`}
            >
              <img src={avatarUrl} alt={`Avatar for ${seed}`} className="w-24 h-24 rounded-full bg-slate-600" />
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <label htmlFor="playerName" className="block text-slate-300 font-bold mb-2">
          Enter Your Name
        </label>
        <input
          type="text"
          id="playerName"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Optional: Enter a name"
          maxLength={12}
          className="w-full max-w-xs mx-auto px-4 py-2 bg-slate-900 border-2 border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      <button
        onClick={handleStartGame}
        className="px-8 py-3 bg-cyan-500 text-slate-900 font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30"
      >
        Start Game
      </button>
    </div>
  );
};

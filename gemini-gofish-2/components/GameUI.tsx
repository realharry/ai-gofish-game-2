
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Rank } from '../game/types';
import { RANKS } from '../game/logic';
import { TrophyIcon, UserIcon, BotIcon, CardsIcon } from './Icons';

interface GameUIProps {
  gameState: GameState | null;
  isThinking: boolean;
  onPlayerAction: (targetPlayerId: number, rank: Rank) => void;
  onStartGame: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ gameState, isThinking, onPlayerAction, onStartGame }) => {
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [gameState?.gameLog]);

  if (!gameState) {
    return <div className="text-center">Loading...</div>;
  }

  const { players, currentPlayerIndex, gameLog, isGameOver, winner } = gameState;
  const humanPlayer = players[0];
  const opponents = players.slice(1);
  // FIX: Use `Array.from` to ensure correct type inference. The spread operator was causing sort parameters to be inferred as `unknown`.
  const availableRanks = Array.from(new Set(humanPlayer.hand.map(c => c.rank))).sort((a,b) => RANKS.indexOf(a) - RANKS.indexOf(b));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayerId !== null && selectedRank) {
      onPlayerAction(selectedPlayerId, selectedRank);
      setSelectedRank(null);
      setSelectedPlayerId(null);
    }
  };

  const isPlayerTurn = currentPlayerIndex === 0 && !isGameOver;

  return (
    <div className="flex flex-col h-full text-sm">
      <h1 className="hidden md:block text-3xl font-bold text-cyan-400 mb-4 pb-4 border-b border-slate-800">AI Go Fish</h1>
      
      {/* Player Scores */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2 text-slate-300">Scoreboard</h2>
        <div className="space-y-2">
          {players.map((p, idx) => (
            <div key={p.id} className={`p-2 rounded-md flex justify-between items-center transition-all duration-300 ${currentPlayerIndex === idx && !isGameOver ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
              <div className="flex items-center gap-2">
                {p.isAI ? <BotIcon className="w-5 h-5 text-cyan-400"/> : <UserIcon className="w-5 h-5 text-green-400"/>}
                <span className="font-medium">{p.name}</span>
                {p.strategy && <span className="text-xs text-slate-400">({p.strategy})</span>}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1" title="Cards in hand">
                   <CardsIcon className="w-4 h-4 text-slate-400"/>
                   <span>{p.hand.length}</span>
                </div>
                <div className="flex items-center gap-1" title="Completed Sets">
                  <TrophyIcon className="w-4 h-4 text-yellow-400"/>
                  <span className="font-bold">{p.sets.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Log */}
      <div className="flex-grow flex flex-col mb-4 bg-slate-800/50 rounded-lg p-2">
        <h2 className="text-lg font-semibold mb-2 text-slate-300 px-2">Game Log</h2>
        <div ref={logRef} className="flex-grow overflow-y-auto pr-2 text-slate-400 space-y-1">
          {gameLog.map((entry, i) => (
            <p key={i} className="px-2">{entry}</p>
          ))}
          {isThinking && <p className="px-2 animate-pulse text-cyan-400">AI is thinking...</p>}
        </div>
      </div>

      {/* Player Controls */}
      <div className="bg-slate-800 rounded-lg p-4">
        {isGameOver ? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-yellow-400 mb-2">Game Over!</h2>
            <p className="mb-4">{winner ? `${winner.name} wins!` : "It's a tie!"}</p>
            <button
              onClick={onStartGame}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Play Again
            </button>
          </div>
        ) : isPlayerTurn ? (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold mb-3 text-center">Your Turn! Ask for a card.</h2>
            <div className="mb-3">
              <label className="block mb-2 font-medium text-slate-400">Rank to ask for:</label>
              <div className="grid grid-cols-5 gap-2">
                {availableRanks.map(rank => (
                  <button type="button" key={rank} onClick={() => setSelectedRank(rank)}
                    className={`p-2 border rounded-md text-center font-bold transition-colors ${selectedRank === rank ? 'bg-green-500 border-green-400 text-white' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}>
                    {rank}
                  </button>
                ))}
              </div>
            </div>
             <div className="mb-4">
              <label className="block mb-2 font-medium text-slate-400">Player to ask:</label>
              <div className="grid grid-cols-3 gap-2">
                {opponents.map(p => (
                   <button type="button" key={p.id} onClick={() => setSelectedPlayerId(p.id)}
                    className={`p-2 border rounded-md text-center font-medium transition-colors ${selectedPlayerId === p.id ? 'bg-green-500 border-green-400 text-white' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}>
                    {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={!selectedRank || selectedPlayerId === null}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
              Ask
            </button>
          </form>
        ) : (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-300">Waiting for other players...</h2>
            <p className="text-slate-400 mt-2">{players[currentPlayerIndex].name}'s turn.</p>
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Rank, Player } from '../game/types';
import { RANKS } from '../game/logic';
import { TrophyIcon, UserIcon, BotIcon, CardsIcon, InfoIcon, MemoryIcon, RandomIcon, TargetedIcon } from './Icons';

interface GameUIProps {
  gameState: GameState | null;
  isThinking: boolean;
  onPlayerAction: (targetPlayerId: number, rank: Rank) => void;
  onStartGame: () => void;
}

const PlayerAvatar: React.FC<{ player: Player }> = ({ player }) => {
  switch (player.avatarId) {
    case 'user':
      return <UserIcon className="w-5 h-5 text-green-400" />;
    case 'memory':
      return <MemoryIcon className="w-5 h-5 text-purple-400" />;
    case 'random':
      return <RandomIcon className="w-5 h-5 text-orange-400" />;
    case 'targeted':
      return <TargetedIcon className="w-5 h-5 text-red-400" />;
    default:
      return <BotIcon className="w-5 h-5 text-cyan-400" />;
  }
};

export const GameUI: React.FC<GameUIProps> = ({ gameState, isThinking, onPlayerAction, onStartGame }) => {
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
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
                <PlayerAvatar player={p} />
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
      
      {/* Rules Section */}
      <div className="mb-4">
        <button
          onClick={() => setIsRulesOpen(!isRulesOpen)}
          className="w-full flex justify-between items-center p-2 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors"
          aria-expanded={isRulesOpen}
          aria-controls="rules-content"
        >
          <div className="flex items-center gap-2">
            <InfoIcon className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-slate-300">Game Rules & AI Strategies</span>
          </div>
          <svg className={`w-5 h-5 text-slate-400 transform transition-transform ${isRulesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div id="rules-content" className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${isRulesOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="mt-2 p-4 bg-slate-800/50 rounded-lg text-slate-300 space-y-3">
            <div>
              <h3 className="font-bold text-cyan-400 mb-1">Objective</h3>
              <p>The goal is to collect the most "sets" of four cards of the same rank (e.g., four Kings, four 7s).</p>
            </div>
            <div>
              <h3 className="font-bold text-cyan-400 mb-1">How to Play</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>On your turn, ask an opponent for a rank you already hold.</li>
                <li>If they have cards of that rank, they give them all to you and you go again.</li>
                <li>If not, they say "Go Fish!" and you draw a card from the deck.</li>
                <li>If you draw the rank you asked for, you get another turn.</li>
                <li>When you collect all 4 cards of a rank, you complete a set.</li>
                <li>The game ends when the deck is empty or a player has no cards. The player with the most sets wins!</li>
              </ul>
            </div>
             <div>
              <h3 className="font-bold text-cyan-400 mb-1">AI Strategies</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Ava (Memory):</strong> Pays attention to what others ask for to make educated guesses.</li>
                  <li><strong>Bob (Random):</strong> Unpredictable. Asks for a random rank from a random player.</li>
                  <li><strong>Charlie (Targeted):</strong> Tries to complete his own sets and often targets players with more cards.</li>
              </ul>
            </div>
          </div>
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

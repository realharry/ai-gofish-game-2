
import React, { useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import Card from './Card';
import PlayerHand from './PlayerHand';
import GameLog from './GameLog';
import Scoreboard from './Scoreboard';
import SettingsModal from './SettingsModal';
import GameOverModal from './GameOverModal';
import { Rank } from '../types';

const GameBoard: React.FC = () => {
    const { gameState, isLoading, userSelection, setUserSelection, handleUserAsk, resetGame, setAIModelForPlayer } = useGameEngine();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const { players, deck, currentPlayerIndex, gameLog, isGameOver, winner } = gameState;
    const currentPlayer = players[currentPlayerIndex];
    const isUserTurn = currentPlayer.id === 'player-0' && !isLoading;

    const handleRankSelect = (rank: Rank) => {
        if (!isUserTurn) return;
        setUserSelection(prev => ({ ...prev, rank }));
    };

    const handlePlayerSelect = (targetId: string) => {
        if (!isUserTurn || !userSelection.rank) return;
        setUserSelection(prev => ({ ...prev, targetId }));
    };
    
    const opponentPositions = [
        { player: players[2], position: 'top-4 left-1/2 -translate-x-1/2' }, // Top
        { player: players[1], position: 'top-1/2 -translate-y-1/2 left-4' }, // Left
        { player: players[3], position: 'top-1/2 -translate-y-1/2 right-4' }, // Right
    ];
    
    return (
        <div className="relative w-full h-full max-w-md mx-auto flex flex-col">
            {isGameOver && <GameOverModal winner={winner} onPlayAgain={resetGame} />}
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                players={players}
                onModelChange={setAIModelForPlayer}
            />
            
            {/* Opponents */}
            {opponentPositions.map(({player, position}) => (
                player && <div key={player.id} className={`absolute ${position} flex flex-col items-center space-y-1 z-10`}>
                     <div 
                        className={`p-2 rounded-lg transition-all duration-300 ${currentPlayer.id === player.id ? 'bg-cyan-500/30' : 'bg-slate-800/50'} ${isUserTurn && userSelection.rank ? 'cursor-pointer ring-2 ring-cyan-400 hover:ring-yellow-400' : ''}`}
                        onClick={() => handlePlayerSelect(player.id)}
                     >
                        <p className={`text-center font-bold text-sm ${currentPlayer.id === player.id ? 'text-cyan-200' : 'text-slate-300'}`}>{player.name}</p>
                        <p className="text-xs text-slate-400 text-center">{player.books.length} books</p>
                        <PlayerHand player={player} isCurrentUser={false} />
                    </div>
                </div>
            ))}
            
            {/* Center Area: Deck & Game Info */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center space-y-4 w-4/5 md:w-3/5">
                <div className="flex items-center justify-center space-x-4">
                    <div className="flex flex-col items-center">
                        <Card card={null} isFaceDown={deck.length > 0}/>
                        <p className="text-sm mt-1 text-slate-400">{deck.length} left</p>
                    </div>
                    <div className="w-40">
                         <Scoreboard players={players} currentPlayerId={currentPlayer.id} />
                    </div>
                </div>
                 <div className="w-full">
                    <GameLog logs={gameLog} />
                </div>
            </div>

            {/* User Area */}
            <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col items-center">
                 <div className={`w-full max-w-sm p-2 rounded-lg transition-all duration-300 ${isUserTurn ? 'bg-cyan-500/30' : 'bg-slate-800/50'}`}>
                    <div className="text-center mb-2">
                        <p className="font-bold text-lg text-white">{players[0].name}</p>
                        <p className="text-sm text-slate-300">{players[0].books.length} books: {players[0].books.join(', ')}</p>
                    </div>
                    <PlayerHand player={players[0]} isCurrentUser={true} onCardRankSelect={handleRankSelect} selectedRank={userSelection.rank} />
                 </div>
                 <div className="flex items-center space-x-2 mt-2">
                    <button
                        onClick={handleUserAsk}
                        disabled={!isUserTurn || !userSelection.rank || !userSelection.targetId}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed transition-transform transform hover:scale-105 disabled:transform-none"
                    >
                       Ask
                    </button>
                    <button
                         onClick={() => setIsSettingsOpen(true)}
                         className="p-2 bg-slate-600 rounded-full hover:bg-slate-500 transition-colors"
                         aria-label="Settings"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                 </div>
            </div>

            {isLoading && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400"></div>
                        <p className="mt-4 text-white text-lg font-semibold">
                            {players[currentPlayerIndex].name} is thinking...
                        </p>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default GameBoard;

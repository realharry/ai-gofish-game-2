
import React, { useState, useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import Card from './Card';
import PlayerHand from './PlayerHand';
import GameLog from './GameLog';
import Scoreboard from './Scoreboard';
import SettingsModal from './SettingsModal';
import GameOverModal from './GameOverModal';
import InstructionsModal from './InstructionsModal';
import AnimatingCard from './AnimatingCard';
import { Rank } from '../types';

const GameBoard: React.FC = () => {
    const { gameState, isLoading, userSelection, setUserSelection, handleUserAsk, resetGame, setAIModelForPlayer, setGameSpeed, aiActionHighlight, cardAnimation } = useGameEngine();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
    const elementRefs = useRef<Record<string, HTMLElement | null>>({});
    
    const { players, deck, currentPlayerIndex, gameLog, isGameOver, winner } = gameState;
    const currentPlayer = players[currentPlayerIndex];
    const isUserTurn = currentPlayer.id === 'player-0' && !isLoading;

    const handleRankSelect = (rank: Rank) => {
        if (!isUserTurn) return;
        setUserSelection(prev => {
            const isSameRank = prev.rank === rank;
            const newRank = isSameRank ? null : rank; // Toggle rank
            const newTargetId = isSameRank ? prev.targetId : null; // Clear target if rank changes
            return { rank: newRank, targetId: newTargetId };
        });
    };

    const handlePlayerSelect = (targetId: string) => {
        if (!isUserTurn || !userSelection.rank) return;
        setUserSelection(prev => ({ ...prev, targetId }));
    };
    
    const opponentPositions = [
        { player: players[2], position: 'top-1 left-1/2 -translate-x-1/2' }, // Top-Middle
        { player: players[1], position: 'top-1 left-4' },                     // Top-Left
        { player: players[3], position: 'top-1 right-4' },                     // Top-Right
    ];
    
    return (
        <div className="relative w-full h-full max-w-md mx-auto flex flex-col">
            {cardAnimation && (() => {
                const fromEl = elementRefs.current[cardAnimation.fromId];
                const toEl = elementRefs.current[cardAnimation.toId];

                if (!fromEl || !toEl) return null;

                const fromRect = fromEl.getBoundingClientRect();
                const toRect = toEl.getBoundingClientRect();

                const startPos = { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 };
                const endPos = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };
                
                return cardAnimation.cards.map((card, index) => (
                    <AnimatingCard
                        key={`${cardAnimation.key}-${index}`}
                        card={card}
                        startPos={startPos}
                        endPos={endPos}
                        delay={index * 100}
                        duration={cardAnimation.duration}
                    />
                ));
            })()}

            {isGameOver && <GameOverModal winner={winner} onPlayAgain={resetGame} />}
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                players={players}
                onModelChange={setAIModelForPlayer}
                gameSpeed={gameState.gameSpeed}
                onGameSpeedChange={setGameSpeed}
            />
            <InstructionsModal 
                isOpen={isInstructionsOpen}
                onClose={() => setIsInstructionsOpen(false)}
            />
            
            {/* Opponents */}
            {opponentPositions.map(({player, position}) => {
                if (!player) return null;

                const isCurrentTurn = currentPlayer.id === player.id;
                const isAsker = aiActionHighlight?.askerId === player.id;
                const isTarget = aiActionHighlight?.targetId === player.id;
                
                let ringClass = '';
                if (userSelection.targetId === player.id) {
                  ringClass = 'ring-4 ring-yellow-400';
                } else if (isAsker) {
                  ringClass = 'ring-4 ring-blue-400';
                } else if (isTarget) {
                  ringClass = 'ring-4 ring-orange-400';
                }

                return (
                    <div 
                        key={player.id} 
                        ref={el => { elementRefs.current[player.id] = el; }}
                        className={`absolute ${position} flex flex-col items-center space-y-1 z-10`}
                    >
                         <div 
                            className={`relative p-2 rounded-lg transition-all duration-300 ${isCurrentTurn ? 'scale-110 bg-cyan-800/90 shadow-2xl shadow-cyan-400/50 border-2 border-cyan-400' : 'bg-slate-800/50 border-2 border-transparent'} ${ringClass}`}
                         >
                             {isCurrentTurn && (
                                <div className="absolute -top-3.5 right-0 left-0 mx-auto w-fit px-3 py-0.5 bg-cyan-400 text-slate-900 text-sm font-bold rounded-full shadow-lg">
                                    TURN
                                </div>
                            )}
                            <p className={`text-center font-bold text-sm md:text-base ${isCurrentTurn ? 'pt-3 text-cyan-100' : 'text-slate-300'}`}>{player.name}</p>
                            <p className="text-xs text-slate-400 text-center">{player.books.length} books • {player.hand.length} cards</p>
                            <PlayerHand player={player} isCurrentUser={false} />
                        </div>
                    </div>
                );
            })}
            
            {/* Center Area: Deck & Game Info */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center space-y-4 w-4/5 md:w-3/5">
                <div className="flex items-center justify-center space-x-4">
                    <div className="flex flex-col items-center" ref={el => { elementRefs.current['deck'] = el; }}>
                        <Card card={null} isFaceDown={deck.length > 0}/>
                        <p className="text-sm mt-1 text-slate-400">{deck.length} left</p>
                    </div>
                    <div className="w-36">
                         <Scoreboard players={players} currentPlayerId={currentPlayer.id} />
                    </div>
                </div>
                 <div className="w-full">
                    <GameLog logs={gameLog} />
                </div>
            </div>

            {/* User Area */}
            <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col items-center">
                 <div 
                    ref={el => { if(players[0]) elementRefs.current[players[0].id] = el; }}
                    className={`relative w-full max-w-lg p-2 rounded-lg transition-all duration-300 ${isUserTurn ? 'scale-110 bg-cyan-800/90 shadow-2xl shadow-cyan-400/50 border-2 border-cyan-400' : 'bg-slate-800/50 border-2 border-transparent'}`}
                 >
                    {isUserTurn && (
                        <div className="absolute -top-4 right-0 left-0 mx-auto w-fit px-4 py-1.5 bg-cyan-400 text-slate-900 text-lg font-bold rounded-full shadow-lg animate-pulse">
                            YOUR TURN
                        </div>
                    )}
                    <div className={`text-center mb-1 ${isUserTurn ? 'pt-4' : ''}`}>
                        <p className="font-bold text-base text-white">{players[0].name}</p>
                        <p className="text-xs text-slate-300">{players[0].books.length} books • {players[0].hand.length} cards</p>
                        {players[0].books.length > 0 &&
                            <p className="text-xs text-slate-400 truncate">Books: {players[0].books.join(', ')}</p>
                        }
                    </div>
                    <PlayerHand player={players[0]} isCurrentUser={true} onCardRankSelect={handleRankSelect} selectedRank={userSelection.rank} />
                 </div>
                 
                 {isUserTurn && userSelection.rank && (
                    <div className="mt-2 text-center w-full max-w-sm bg-slate-800/70 p-3 rounded-lg">
                        <p className="font-semibold text-cyan-200 mb-2">Who do you want to ask for {userSelection.rank}s?</p>
                        <div className="flex justify-center items-center space-x-2">
                            {players.filter(p => p.isAI).map(opponent => (
                                <button
                                    key={opponent.id}
                                    onClick={() => handlePlayerSelect(opponent.id)}
                                    className={`px-4 py-2 font-bold rounded-lg transition-all duration-200 border-2 text-sm md:text-base ${
                                        userSelection.targetId === opponent.id 
                                        ? 'bg-yellow-400 border-yellow-300 text-slate-900 scale-105' 
                                        : 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500'
                                    }`}
                                >
                                    {opponent.name}
                                </button>
                            ))}
                        </div>
                    </div>
                 )}

                 <div className="flex items-center space-x-2 mt-2">
                    <button
                        onClick={handleUserAsk}
                        disabled={!isUserTurn || !userSelection.rank || !userSelection.targetId}
                        className="px-5 py-2 text-sm bg-green-600 text-white font-bold rounded-lg shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed transition-transform transform hover:scale-105 disabled:transform-none"
                    >
                       Ask
                    </button>
                    <button
                         onClick={() => setIsSettingsOpen(true)}
                         className="p-1.5 bg-slate-600 rounded-full hover:bg-slate-500 transition-colors"
                         aria-label="Settings"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <button
                         onClick={() => setIsInstructionsOpen(true)}
                         className="p-1.5 bg-slate-600 rounded-full hover:bg-slate-500 transition-colors"
                         aria-label="How to Play"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                 </div>
            </div>

            {isLoading && (
                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-40">
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
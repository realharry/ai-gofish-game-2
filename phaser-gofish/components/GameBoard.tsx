import React, { useState, useRef, useEffect } from 'react';
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
import { setMuted, unlockAudio, AUDIO_STATE_CHANGE_EVENT } from '../services/audioService';
import ConfirmationModal from './ConfirmationModal';
import BookDisplay from './BookDisplay';

const AnimatedBanner = () => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const timer = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(timer);
    }, []);

    return (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-[100] transition-opacity duration-300" style={{ opacity: visible ? 1 : 0 }}>
            <div
                className="text-center transition-all duration-500 ease-out"
                style={{ transform: visible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(10px)', opacity: visible ? 1 : 0 }}
            >
                <h2 className="text-5xl font-bold text-cyan-300 tracking-wider">New Game</h2>
                <p className="text-xl text-slate-300 mt-2">Shuffling the deck...</p>
            </div>
        </div>
    );
};

type GameBoardProps = ReturnType<typeof useGameEngine>;

const GameBoard: React.FC<GameBoardProps> = (props) => {
    const { gameState, isLoading, userSelection, setUserSelection, handleUserAsk, resetGame, setPlayerName, setAIModelForPlayer, setGameSpeed, setCardBack, setTheme, aiActionHighlight, cardAnimation, showNewGameBanner, bookAnimation } = props;
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
    const [isNewGameConfirmOpen, setIsNewGameConfirmOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const elementRefs = useRef<Record<string, HTMLElement | null>>({});
    const audioUnlocked = useRef(false);
    
    const { players, deck, currentPlayerIndex, gameLog, isGameOver, winner, cardBack, theme } = gameState;
    const currentPlayer = players[currentPlayerIndex];
    const isUserTurn = currentPlayer.id === 'player-0' && !isLoading;

    useEffect(() => {
        const handleAudioStateChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ isMuted: boolean }>;
            if (typeof customEvent.detail.isMuted === 'boolean') {
                setIsMuted(customEvent.detail.isMuted);
            }
        };

        window.addEventListener(AUDIO_STATE_CHANGE_EVENT, handleAudioStateChange);

        return () => {
            window.removeEventListener(AUDIO_STATE_CHANGE_EVENT, handleAudioStateChange);
        };
    }, []);

    const handleUnlockAudio = () => {
        if (!audioUnlocked.current) {
            unlockAudio();
            audioUnlocked.current = true;
        }
    };

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

    const toggleMute = () => {
        setMuted(!isMuted);
    };
    
    const opponentPositions = [
        { player: players[2], position: 'top-1 left-1/2 -translate-x-1/2' }, // Top-Middle
        { player: players[1], position: 'top-1 left-4' },                     // Top-Left
        { player: players[3], position: 'top-1 right-4' },                     // Top-Right
    ];
    
    return (
        <div 
            className="relative w-full h-full max-w-md mx-auto flex flex-col"
            onClickCapture={handleUnlockAudio}
        >
            {showNewGameBanner && <AnimatedBanner />}
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

            {isGameOver && <GameOverModal winner={winner} players={players} onPlayAgain={resetGame} />}
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                players={players}
                onModelChange={setAIModelForPlayer}
                gameSpeed={gameState.gameSpeed}
                onGameSpeedChange={setGameSpeed}
                cardBack={cardBack}
                onCardBackChange={setCardBack}
                theme={theme}
                onThemeChange={setTheme}
                playerName={players[0]?.name || 'You'}
                onPlayerNameChange={setPlayerName}
            />
            <InstructionsModal 
                isOpen={isInstructionsOpen}
                onClose={() => setIsInstructionsOpen(false)}
            />
            <ConfirmationModal
                isOpen={isNewGameConfirmOpen}
                onClose={() => setIsNewGameConfirmOpen(false)}
                onConfirm={() => {
                    resetGame();
                    setIsNewGameConfirmOpen(false);
                }}
                title="Start New Game?"
                message="Your current game progress will be lost. Are you sure?"
            />
            
            {/* Opponents */}
            {opponentPositions.map(({player, position}) => {
                if (!player) return null;

                const isCurrentTurn = currentPlayer.id === player.id;
                const isThinking = isLoading && isCurrentTurn;
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
                            className={`relative p-1 rounded-lg transition-all duration-300 ${isCurrentTurn ? 'scale-110 bg-cyan-800/90 shadow-2xl shadow-cyan-400/50 border-2 border-cyan-400' : 'bg-slate-800/50 border-2 border-transparent'} ${ringClass}`}
                         >
                             {isCurrentTurn && !isThinking && (
                                <div className="absolute -top-3.5 right-0 left-0 mx-auto w-fit px-3 py-0.5 bg-cyan-400 text-slate-900 text-sm font-bold rounded-full shadow-lg">
                                    TURN
                                </div>
                            )}
                            <p className={`text-center font-bold text-sm ${isCurrentTurn ? 'pt-3 text-cyan-100' : 'text-slate-300'}`}>{player.name}</p>
                            <p className="text-xs text-slate-400 text-center">{player.books.length} books • {player.hand.length} cards</p>
                            <BookDisplay books={player.books} isOpponent highlightedRank={bookAnimation?.playerId === player.id ? bookAnimation.rank : null} />
                            {isThinking ? (
                                <div className="flex flex-col justify-center items-center h-20 space-y-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-300"></div>
                                    <p className="text-xs text-cyan-300">Thinking...</p>
                                </div>
                            ) : (
                                <PlayerHand player={player} isCurrentUser={false} cardBack={cardBack} />
                            )}
                        </div>
                    </div>
                );
            })}
            
            {/* Center Area: Deck & Game Info */}
            <div className="absolute top-40 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 w-full px-2">
                <div className="flex items-center justify-center space-x-4">
                    <div className="flex flex-col items-center" ref={el => { elementRefs.current['deck'] = el; }}>
                        <div className="relative w-14 h-20 md:w-16 md:h-24 flex items-center justify-center">
                            {deck.length === 0 ? (
                                <Card card={null} isFaceDown={false} />
                            ) : (
                                <>
                                    {deck.length > 2 && (
                                        <div className="absolute w-full h-full bg-slate-800 border-2 border-slate-600 rounded-lg shadow-md transform -rotate-6"></div>
                                    )}
                                    {deck.length > 1 && (
                                        <div className="absolute w-full h-full bg-slate-800 border-2 border-slate-600 rounded-lg shadow-md transform rotate-3"></div>
                                    )}
                                    <div className="absolute w-full h-full">
                                        <Card card={null} isFaceDown={true} className="w-full h-full" cardBack={cardBack} />
                                    </div>
                                </>
                            )}
                        </div>
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
                    </div>
                    <BookDisplay books={players[0].books} highlightedRank={bookAnimation?.playerId === players[0].id ? bookAnimation.rank : null} />
                    <PlayerHand player={players[0]} isCurrentUser={true} onCardRankSelect={handleRankSelect} selectedRank={userSelection.rank} cardBack={cardBack} />
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
                         onClick={() => setIsNewGameConfirmOpen(true)}
                         className="p-1.5 bg-red-600 rounded-full hover:bg-red-500 transition-colors"
                         aria-label="New Game"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M20.49 9A9 9 0 0 0 7.54 5.46"></path><path d="M3.51 15A9 9 0 0 0 16.46 18.54"></path></svg>
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
                    <button
                        onClick={toggleMute}
                        className="p-1.5 bg-slate-600 rounded-full hover:bg-slate-500 transition-colors"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        )}
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default GameBoard;
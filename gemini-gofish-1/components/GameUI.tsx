import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useGoFish } from '../hooks/useGoFish';
import { getAIMove } from '../game/ai';
import { Player, Rank } from '../types';
import { OpponentUI } from './OpponentUI';
import { PlayerUI } from './PlayerUI';
import { GameLog } from './GameLog';
import { GameOverDialog, Toast } from './ui/Dialog';
import { AI_THINKING_TIME } from '../game/constants';
import { AnimatedCard } from './AnimatedCard';
import { useSound } from '../hooks/useSound';
import { cardSfx, bookSfx, gameOverSfx, clickSfx } from '../assets/sounds';
import { Scoreboard } from './Scoreboard';
import { AskIndicator } from './AskIndicator';
import { AvatarSelection } from './AvatarSelection';

type ElementPositions = {
  [key: string]: DOMRect | undefined;
};

export const GameUI: React.FC = () => {
  const { state, dispatch, startGame } = useGoFish();
  const { players, currentPlayerIndex, phase, gameLog, isGameOver, winner, animationState } = state;
  const [isStarted, setIsStarted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const playerUIRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const deckRef = useRef<HTMLDivElement | null>(null);
  const [positions, setPositions] = useState<ElementPositions>({});

  // Initialize sound effects
  const playCardSound = useSound(cardSfx);
  const playBookSound = useSound(bookSfx);
  const playGameOverSound = useSound(gameOverSfx);
  const playClickSound = useSound(clickSfx, 0.5);

  useEffect(() => {
    const calculatePositions = () => {
      const newPositions: ElementPositions = {};
      if (deckRef.current) {
        newPositions['deck'] = deckRef.current.getBoundingClientRect();
      }
      players.forEach(p => {
        if (playerUIRefs.current[p.id]) {
          newPositions[`player-${p.id}`] = playerUIRefs.current[p.id]?.getBoundingClientRect();
        }
      });
      setPositions(newPositions);
    };

    if (isStarted) {
      calculatePositions();
      window.addEventListener('resize', calculatePositions);
    }
    return () => window.removeEventListener('resize', calculatePositions);
  }, [players, isStarted]);


  // Effect to show toast notifications and play sounds for key game events
  useEffect(() => {
    if (gameLog.length === 0) return;
    
    const lastLog = gameLog[gameLog.length - 1];
    let message: string | null = null;
    
    const currentPlayer = players[currentPlayerIndex];

    if (lastLog.includes("turn.") && currentPlayer?.isHuman) {
      message = "Your Turn!";
    } else if (lastLog.startsWith("It's now")) {
      message = lastLog;
    } else if (lastLog.includes("Go Fish!")) {
      message = lastLog;
      playCardSound();
    } else if (lastLog.includes("gave")) {
      playCardSound();
    } else if (lastLog.includes("made a book")) {
      message = lastLog;
      playBookSound();
    }

    if (message) {
      setToastMessage(message);
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000); // Display toast for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [gameLog, playCardSound, playBookSound, currentPlayerIndex, players]);

  // Effect to play game over sound
  useEffect(() => {
      if (isGameOver) {
          playGameOverSound();
      }
  }, [isGameOver, playGameOverSound]);

  // Effect to handle AI turns
  useEffect(() => {
    if (phase === 'AI_TURN' && !isGameOver) {
      const aiPlayer = players[currentPlayerIndex];
      const timeoutId = setTimeout(() => {
        const move = getAIMove(state, aiPlayer);
        if (move) {
          dispatch({
            type: 'ASK_CARD',
            payload: {
              askerId: aiPlayer.id,
              targetId: move.targetId,
              rank: move.rank,
            },
          });
        } else {
            const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            dispatch({ type: 'END_TURN', payload: { nextPlayerIndex } });
        }
      }, AI_THINKING_TIME);

      return () => clearTimeout(timeoutId);
    }
  }, [phase, currentPlayerIndex, players, dispatch, isGameOver, state]);

  // Effect to handle animation completion
  useEffect(() => {
    if (phase === 'ANIMATING') {
      const duration = animationState?.type === 'ask' ? 800 : 1200;
      const timer = setTimeout(() => {
        dispatch({ type: 'ANIMATION_COMPLETE' });
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [phase, dispatch, animationState]);


  const humanPlayer = useMemo(() => players.find(p => p.isHuman), [players]);
  const opponents = useMemo(() => players.filter(p => !p.isHuman), [players]);

  const handleStartGame = (avatarUrl: string, playerName: string) => {
    startGame(avatarUrl, playerName);
    setIsStarted(true);
  };

  const handleRestart = () => {
    playClickSound();
    setIsStarted(false);
  };

  const handleAsk = (targetId: number, rank: Rank) => {
    if (phase === 'PLAYER_TURN' && humanPlayer) {
      dispatch({ type: 'ASK_CARD', payload: { askerId: humanPlayer.id, targetId, rank } });
    }
  };

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center">
        <AvatarSelection onStartGame={handleStartGame} />
      </div>
    );
  }

  if (!humanPlayer) return <div className="text-center text-xl">Loading game...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto h-[80vh] grid grid-cols-4 grid-rows-3 gap-4 relative">
      {toastMessage && <Toast message={toastMessage} key={Date.now()} />}
      {isGameOver && <GameOverDialog winner={winner} onRestart={handleRestart} />}
      
      {animationState?.type === 'ask' && positions[`player-${animationState.fromId}`] && positions[`player-${animationState.toId}`] && (
        <AskIndicator
            startRect={positions[`player-${animationState.fromId}`]!}
            endRect={positions[`player-${animationState.toId}`]!}
        />
      )}

      {animationState && animationState.type !== 'ask' && animationState.cards && positions && animationState.cards.map((card, index) => {
          const fromKey = animationState.fromId === 'deck' ? 'deck' : `player-${animationState.fromId}`;
          const toKey = `player-${animationState.toId}`;
          const startRect = positions[fromKey];
          const endRect = positions[toKey];
          if (!startRect || !endRect) return null;
          return (
            <AnimatedCard 
              key={card.id + index}
              card={card}
              startRect={startRect}
              endRect={endRect}
              isBook={animationState.type === 'book'}
              delay={index * 100}
              index={index}
              total={animationState.cards.length}
            />
          )
      })}


      <div className="row-start-1 col-start-1 flex items-start justify-center pt-4">
        <Scoreboard players={players} />
      </div>

      <div className="col-start-2 col-span-2 flex justify-center items-center">
        {/* FIX: Changed arrow function to have a block body to prevent returning a value, which is invalid for a callback ref. */}
        {opponents[1] && <div ref={el => { playerUIRefs.current[opponents[1].id] = el; }}><OpponentUI player={opponents[1]} isCurrent={currentPlayerIndex === opponents[1].id} /></div>}
      </div>
      
      <div className="row-start-2 flex flex-col justify-center items-center">
        {/* FIX: Changed arrow function to have a block body to prevent returning a value, which is invalid for a callback ref. */}
        {opponents[0] && <div ref={el => { playerUIRefs.current[opponents[0].id] = el; }}><OpponentUI player={opponents[0]} isCurrent={currentPlayerIndex === opponents[0].id} /></div>}
      </div>
      
      <div ref={deckRef} className="col-start-2 col-span-2 row-start-2 bg-slate-800/50 rounded-lg border border-slate-700 flex justify-center items-center">
        <p className="text-2xl text-slate-400">Deck: {state.deck.length} cards</p>
      </div>
      
      <div className="row-start-2 flex flex-col justify-center items-center">
        {/* FIX: Changed arrow function to have a block body to prevent returning a value, which is invalid for a callback ref. */}
        {opponents[2] && <div ref={el => { playerUIRefs.current[opponents[2].id] = el; }}><OpponentUI player={opponents[2]} isCurrent={currentPlayerIndex === opponents[2].id} /></div>}
      </div>

      {/* FIX: Changed arrow function to have a block body to prevent returning a value, which is invalid for a callback ref. */}
      <div className="col-span-4 row-start-3" ref={el => { playerUIRefs.current[humanPlayer.id] = el; }}>
        <PlayerUI 
            player={humanPlayer} 
            opponents={opponents}
            onAsk={handleAsk}
            isCurrent={currentPlayerIndex === humanPlayer.id}
            phase={phase}
        />
      </div>

      <div className="fixed bottom-4 right-4 z-20 max-h-[40vh] md:absolute md:top-4 md:right-4 md:h-full md:py-20 md:bottom-auto md:max-h-none">
        <GameLog logs={gameLog} />
      </div>
    </div>
  );
};
import { useState, useEffect, useCallback } from 'react';
import { GameState, Player, Rank, Card, AIModel, TurnRecord, GameSpeed, CardBack } from '../types';
import { initializeGame, checkForBooks } from '../services/gameLogic';
import { getAIAction } from '../services/geminiService';
import { ANIMATION_DURATIONS, GAME_SPEED_DELAYS } from '../constants';
import { playSound, SoundEffect } from '../services/audioService';

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(initializeGame);
  const [isLoading, setIsLoading] = useState(false);
  const [userSelection, setUserSelection] = useState<{ rank: Rank | null; targetId: string | null }>({ rank: null, targetId: null });
  const [aiActionHighlight, setAiActionHighlight] = useState<{ askerId: string; targetId: string } | null>(null);
  const [cardAnimation, setCardAnimation] = useState<{ fromId: string; toId: string; cards: Card[]; key: number; duration: number } | null>(null);
  const [showNewGameBanner, setShowNewGameBanner] = useState(true);

  useEffect(() => {
    // Hide banner after initial load
    const timer = setTimeout(() => setShowNewGameBanner(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const nextTurn = useCallback(() => {
    setGameState(prev => {
      if (prev.isGameOver) return prev;
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      return { ...prev, currentPlayerIndex: nextPlayerIndex };
    });
  }, []);

  const checkGameOver = (currentState: GameState): GameState => {
      const totalBooks = currentState.players.reduce((sum, p) => sum + p.books.length, 0);
      if (totalBooks === 13) {
          let winner: Player | null = null;
          let maxBooks = -1;
          currentState.players.forEach(p => {
              if (p.books.length > maxBooks) {
                  maxBooks = p.books.length;
                  winner = p;
              } else if (p.books.length === maxBooks) {
                  winner = null; // Tie
              }
          });
          playSound(SoundEffect.GameOver);
          return { ...currentState, isGameOver: true, winner };
      }

      const isAnyPlayerOutOfCards = currentState.players.some(p => p.hand.length === 0);
      if (currentState.deck.length === 0 && isAnyPlayerOutOfCards) {
         let winner: Player | null = null;
          let maxBooks = -1;
          currentState.players.forEach(p => {
              if (p.books.length > maxBooks) {
                  maxBooks = p.books.length;
                  winner = p;
              } else if (p.books.length === maxBooks) {
                  winner = null; // Tie
              }
          });
          playSound(SoundEffect.GameOver);
          return { ...currentState, isGameOver: true, winner };
      }

      return currentState;
  }

  const processTurn = useCallback((askerId: string, targetId: string, rank: Rank) => {
    setGameState(prev => {
      let newState = JSON.parse(JSON.stringify(prev));
      const asker = newState.players.find((p: Player) => p.id === askerId);
      const target = newState.players.find((p: Player) => p.id === targetId);

      if (!asker || !target) return newState;

      const targetHasCards = target.hand.filter((card: Card) => card.rank === rank);
      const wasSuccessful = targetHasCards.length > 0;

      const newHistoryEntry: TurnRecord = { askerId, targetId, rank, wasSuccessful };
      let turnContinues = false;

      if (wasSuccessful) {
        target.hand = target.hand.filter((card: Card) => card.rank !== rank);
        asker.hand.push(...targetHasCards);
        
        playSound(SoundEffect.CardDeal);
        setCardAnimation({ fromId: target.id, toId: asker.id, cards: targetHasCards, key: Date.now(), duration: ANIMATION_DURATIONS[newState.gameSpeed] });
        newHistoryEntry.transferredCards = targetHasCards;

        newState.gameLog.push(`${asker.name} took ${targetHasCards.length} ${rank}s from ${target.name}.`);
        turnContinues = true;
        
        const newBooks = checkForBooks(asker);
        if (newBooks.length > 0) {
            playSound(SoundEffect.BookComplete);
            newState.gameLog.push(`${asker.name} completed a book of ${newBooks.join(', ')}s!`);
        }
      } else {
        playSound(SoundEffect.GoFish);
        newState.gameLog.push(`${target.name} says "Go Fish!" to ${asker.name}.`);
        if (newState.deck.length > 0) {
          const drawnCard = newState.deck.pop()!;
          asker.hand.push(drawnCard);
          newHistoryEntry.drewCard = drawnCard;
          
          playSound(SoundEffect.CardDeal);
          setCardAnimation({ fromId: 'deck', toId: asker.id, cards: [drawnCard], key: Date.now(), duration: ANIMATION_DURATIONS[newState.gameSpeed] });

          newState.gameLog.push(`${asker.name} drew a card.`);

          const newBooks = checkForBooks(asker);
          if (newBooks.length > 0) {
              playSound(SoundEffect.BookComplete);
              newState.gameLog.push(`${asker.name} completed a book of ${newBooks.join(', ')}s!`);
          }

          if (drawnCard.rank === rank) {
            newState.gameLog.push(`Lucky draw! ${asker.name} gets another turn.`);
            turnContinues = true;
          }
        } else {
          newState.gameLog.push("The deck is empty!");
        }
      }
      
      if (!turnContinues) {
          newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
      }
      
      newState.history.push(newHistoryEntry);
      const finalState = checkGameOver(newState);
      return finalState;
    });
  }, []);

  const handleUserAsk = () => {
    if (!userSelection.rank || !userSelection.targetId) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== 'player-0') return;

    processTurn(currentPlayer.id, userSelection.targetId, userSelection.rank);
    setUserSelection({ rank: null, targetId: null });
  };

  const resetGame = () => {
    playSound(SoundEffect.NewGame);
    setShowNewGameBanner(true);
    const newGame = initializeGame();
    // Persist settings across resets
    newGame.players[0].name = gameState.players[0].name;
    newGame.players.forEach((p, i) => {
        if (p.isAI) p.aiModel = gameState.players[i].aiModel;
    });
    newGame.gameSpeed = gameState.gameSpeed;
    newGame.cardBack = gameState.cardBack;

    setGameState(newGame);
    setIsLoading(false);
    setUserSelection({ rank: null, targetId: null });
    setAiActionHighlight(null);
    setCardAnimation(null);
    setTimeout(() => {
        setShowNewGameBanner(false);
    }, 1800);
  };

  const setPlayerName = (name: string) => {
    setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => {
            if (p.id === 'player-0') {
                return { ...p, name: name }; // Allow empty string while typing
            }
            return p;
        })
    }));
  };

  const setAIModelForPlayer = (playerId: string, model: AIModel) => {
    setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === playerId ? {...p, aiModel: model} : p)
    }));
  };
  
  const setGameSpeed = (speed: GameSpeed) => {
      setGameState(prev => ({ ...prev, gameSpeed: speed }));
  };

  const setCardBack = (back: CardBack) => {
      setGameState(prev => ({ ...prev, cardBack: back }));
  };

  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isAI && !gameState.isGameOver && !isLoading) {
        if (currentPlayer.hand.length === 0) {
            if(gameState.deck.length > 0) {
                setTimeout(() => {
                    setGameState(prev => {
                        const newState = JSON.parse(JSON.stringify(prev));
                        const asker = newState.players[newState.currentPlayerIndex];
                        const drawnCard = newState.deck.pop()!;
                        asker.hand.push(drawnCard);

                        playSound(SoundEffect.CardDeal);
                        setCardAnimation({ fromId: 'deck', toId: asker.id, cards: [drawnCard], key: Date.now(), duration: ANIMATION_DURATIONS[newState.gameSpeed] });
                        
                        newState.gameLog.push(`${asker.name} had no cards and drew one.`);
                        
                        const newBooks = checkForBooks(asker);
                        if(newBooks.length > 0){
                            playSound(SoundEffect.BookComplete);
                            newState.gameLog.push(`${asker.name} completed a book of ${newBooks.join(', ')}s!`);
                        }

                        newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
                        
                        const finalState = checkGameOver(newState);
                        return finalState;
                    });
                }, GAME_SPEED_DELAYS[gameState.gameSpeed]);
            } else {
                setTimeout(() => nextTurn(), GAME_SPEED_DELAYS[gameState.gameSpeed]);
            }
            return;
        }

        setIsLoading(true);
        const thinkingTimeout = setTimeout(async () => {
            try {
                const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);
                const action = await getAIAction(currentPlayer, otherPlayers, gameState.history);

                setAiActionHighlight({ askerId: currentPlayer.id, targetId: action.playerToAskId });
                
                const actionTimeout = setTimeout(() => {
                    processTurn(currentPlayer.id, action.playerToAskId, action.rankToAsk);
                    setAiActionHighlight(null);
                    setIsLoading(false);
                }, GAME_SPEED_DELAYS[gameState.gameSpeed] * 0.8);
                
                return () => clearTimeout(actionTimeout);

            } catch (error) {
                console.error("AI action failed:", error);
                setIsLoading(false);
                nextTurn(); 
            }
        }, GAME_SPEED_DELAYS[gameState.gameSpeed]);

        return () => clearTimeout(thinkingTimeout);
    }
  }, [gameState.currentPlayerIndex, gameState.isGameOver, gameState.history.length, gameState.gameSpeed]);

  return { gameState, isLoading, userSelection, setUserSelection, handleUserAsk, resetGame, setPlayerName, setAIModelForPlayer, setGameSpeed, setCardBack, aiActionHighlight, cardAnimation, showNewGameBanner };
};
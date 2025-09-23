
import { useState, useEffect, useCallback } from 'react';
import { GameState, Player, Rank, Card, AIModel, TurnRecord, GameSpeed } from '../types';
import { initializeGame, checkForBooks } from '../services/gameLogic';
import { getAIAction } from '../services/geminiService';
import { ANIMATION_DURATIONS, GAME_SPEED_DELAYS } from '../constants';

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(initializeGame);
  const [isLoading, setIsLoading] = useState(false);
  const [userSelection, setUserSelection] = useState<{ rank: Rank | null; targetId: string | null }>({ rank: null, targetId: null });
  const [aiActionHighlight, setAiActionHighlight] = useState<{ askerId: string; targetId: string } | null>(null);
  const [cardAnimation, setCardAnimation] = useState<{ fromId: string; toId: string; cards: Card[]; key: number; duration: number } | null>(null);

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

      if (wasSuccessful) {
        target.hand = target.hand.filter((card: Card) => card.rank !== rank);
        asker.hand.push(...targetHasCards);
        
        setCardAnimation({ fromId: target.id, toId: asker.id, cards: targetHasCards, key: Date.now(), duration: ANIMATION_DURATIONS[newState.gameSpeed] });
        newHistoryEntry.transferredCards = targetHasCards;

        newState.gameLog.push(`${asker.name} took ${targetHasCards.length} ${rank}s from ${target.name}.`);
        
        const newBooks = checkForBooks(asker);
        if (newBooks.length > 0) {
            newState.gameLog.push(`${asker.name} completed a book of ${newBooks.join(', ')}s!`);
        }
      } else {
        newState.gameLog.push(`${target.name} says "Go Fish!" to ${asker.name}.`);
        if (newState.deck.length > 0) {
          const drawnCard = newState.deck.pop()!;
          asker.hand.push(drawnCard);
          newHistoryEntry.drewCard = drawnCard;
          
          setCardAnimation({ fromId: 'deck', toId: asker.id, cards: [drawnCard], key: Date.now(), duration: ANIMATION_DURATIONS[newState.gameSpeed] });

          newState.gameLog.push(`${asker.name} drew a card.`);

          const newBooks = checkForBooks(asker);
          if (newBooks.length > 0) {
              newState.gameLog.push(`${asker.name} completed a book of ${newBooks.join(', ')}s!`);
          }

          if (drawnCard.rank === rank) {
            newState.gameLog.push(`Lucky draw! ${asker.name} gets another turn.`);
          } else {
            newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
          }
        } else {
          newState.gameLog.push("The deck is empty!");
          newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
        }
      }
      
      newState.history.push(newHistoryEntry);
      newState = checkGameOver(newState);
      
      return newState;
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
    setGameState(initializeGame());
    setIsLoading(false);
    setUserSelection({ rank: null, targetId: null });
    setAiActionHighlight(null);
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
                        setCardAnimation({ fromId: 'deck', toId: asker.id, cards: [drawnCard], key: Date.now(), duration: ANIMATION_DURATIONS[newState.gameSpeed] });
                        newState.gameLog.push(`${asker.name} had no cards and drew one.`);
                        checkForBooks(asker);
                        newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
                        return checkGameOver(newState);
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

  return { gameState, isLoading, userSelection, setUserSelection, handleUserAsk, resetGame, setAIModelForPlayer, setGameSpeed, aiActionHighlight, cardAnimation };
};

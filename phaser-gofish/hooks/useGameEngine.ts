
import { useState, useEffect, useCallback } from 'react';
import { GameState, Player, Rank, Card, AIModel, TurnRecord } from '../types';
import { initializeGame, checkForBooks } from '../services/gameLogic';
import { getAIAction } from '../services/geminiService';

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(initializeGame);
  const [isLoading, setIsLoading] = useState(false);
  const [userSelection, setUserSelection] = useState<{ rank: Rank | null; targetId: string | null }>({ rank: null, targetId: null });

  const nextTurn = useCallback(() => {
    setGameState(prev => {
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      return { ...prev, currentPlayerIndex: nextPlayerIndex };
    });
  }, []);

  const processTurn = useCallback(async (askerId: string, targetId: string, rank: Rank) => {
    setIsLoading(true);

    let wasSuccessful = false;
    let turnAgain = false;
    let drawnCard: Card | null = null;
    let newBooks: Rank[] = [];
    let logMessage = '';

    setGameState(prev => {
      const newState = JSON.parse(JSON.stringify(prev)) as GameState;
      const asker = newState.players.find(p => p.id === askerId)!;
      const target = newState.players.find(p => p.id === targetId)!;
      logMessage = `${asker.name} asks ${target.name} for ${rank}s...`;
      newState.gameLog.push(logMessage);

      const matchingCards = target.hand.filter(card => card.rank === rank);

      if (matchingCards.length > 0) {
        // Successful ask
        wasSuccessful = true;
        turnAgain = true;
        asker.hand.push(...matchingCards);
        target.hand = target.hand.filter(card => card.rank !== rank);
        
        logMessage = `${target.name} has ${matchingCards.length} ${rank}(s). ${asker.name} gets another turn.`;

        const booksFromAsk = checkForBooks(asker);
        if(booksFromAsk.length > 0) {
            newBooks.push(...booksFromAsk);
            logMessage += ` ${asker.name} made a book of ${booksFromAsk.join(', ')}s!`;
        }
      } else {
        // Go Fish
        logMessage = `${target.name} says "Go Fish!"`;
        if (newState.deck.length > 0) {
          drawnCard = newState.deck.pop()!;
          asker.hand.push(drawnCard);
          logMessage += ` ${asker.name} draws a card.`;
          
          if (drawnCard.rank === rank) {
            turnAgain = true;
            logMessage += ` It's a ${rank}! ${asker.name} gets another turn.`;
          }
          const booksFromDraw = checkForBooks(asker);
          if(booksFromDraw.length > 0){
             newBooks.push(...booksFromDraw);
             logMessage += ` ${asker.name} made a book of ${booksFromDraw.join(', ')}s!`;
          }
        } else {
            logMessage += ` The deck is empty.`;
        }
      }

      newState.gameLog.push(logMessage);
      
      // Fix: Correctly map the drawnCard variable to the drewCard property of TurnRecord.
      const newHistoryRecord: TurnRecord = { askerId, targetId, rank, wasSuccessful, drewCard: drawnCard };
      newState.history.push(newHistoryRecord);
      
      // Check for game over
      const totalBooks = newState.players.reduce((sum, p) => sum + p.books.length, 0);
      if (newState.deck.length === 0 || asker.hand.length === 0 || totalBooks === 13) {
        newState.isGameOver = true;
        let maxBooks = -1;
        let winners: Player[] = [];
        newState.players.forEach(p => {
          if (p.books.length > maxBooks) {
            maxBooks = p.books.length;
            winners = [p];
          } else if (p.books.length === maxBooks) {
            winners.push(p);
          }
        });
        newState.winner = winners.length === 1 ? winners[0] : null; // Handle ties later if needed
        newState.gameLog.push('Game over!');
        if (newState.winner) {
            newState.gameLog.push(`${newState.winner.name} wins!`);
        } else {
            newState.gameLog.push(`It's a tie!`);
        }
      }

      if (!turnAgain && !newState.isGameOver) {
        newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
      }

      return newState;
    });

    setIsLoading(false);
  }, []);

  const handlePlayerTurn = useCallback(async () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isAI && !gameState.isGameOver) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // AI thinking delay
      
      if(currentPlayer.hand.length === 0) {
          nextTurn();
          setIsLoading(false);
          return;
      }
      
      const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);
      const action = await getAIAction(currentPlayer, otherPlayers, gameState.history);
      
      await processTurn(currentPlayer.id, action.playerToAskId, action.rankToAsk);

    }
  }, [gameState, processTurn, nextTurn]);
  
  // Effect to trigger AI turns
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isAI && !isLoading && !gameState.isGameOver) {
      handlePlayerTurn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayerIndex, gameState.isGameOver, isLoading]);

  const handleUserAsk = () => {
    if (userSelection.rank && userSelection.targetId) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      processTurn(currentPlayer.id, userSelection.targetId, userSelection.rank);
      setUserSelection({ rank: null, targetId: null });
    }
  };
  
  const resetGame = () => {
    setGameState(initializeGame());
    setIsLoading(false);
    setUserSelection({rank: null, targetId: null});
  }

  const setAIModelForPlayer = (playerId: string, model: AIModel) => {
    setGameState(prev => {
      const newPlayers = prev.players.map(p => {
        if(p.id === playerId) {
          return {...p, aiModel: model};
        }
        return p;
      });
      return {...prev, players: newPlayers};
    });
  };

  return {
    gameState,
    isLoading,
    userSelection,
    setUserSelection,
    handleUserAsk,
    resetGame,
    setAIModelForPlayer
  };
};

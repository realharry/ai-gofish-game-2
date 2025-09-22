
import { useState, useEffect, useCallback } from 'react';
import { GameState, Player, Rank, Card } from '../game/types';
import { initializeGame, checkForSets } from '../game/logic';
import { getAIDecision } from '../services/geminiService';

const AI_THINKING_TIME = 1500; // ms

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const startGame = useCallback(() => {
    setGameState(initializeGame());
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const processTurn = useCallback((askerId: number, targetId: number, rank: Rank) => {
    setGameState(prevState => {
      if (!prevState) return null;

      let newState = { ...prevState, players: prevState.players.map(p => ({ ...p, hand: [...p.hand] })) };
      let turnLog: string[] = [];

      const asker = newState.players.find(p => p.id === askerId);
      const target = newState.players.find(p => p.id === targetId);
      if (!asker || !target) return prevState;

      turnLog.push(`${asker.name} asked ${target.name} for ${rank}s.`);
      
      const matchingCards = target.hand.filter(card => card.rank === rank);
      let playerGoesAgain = false;

      if (matchingCards.length > 0) {
        // Player has the cards
        target.hand = target.hand.filter(card => card.rank !== rank);
        asker.hand.push(...matchingCards);
        turnLog.push(`${target.name} gave ${matchingCards.length} card(s) to ${asker.name}.`);
        playerGoesAgain = true;
      } else {
        // Go Fish
        turnLog.push(`${target.name} said "Go Fish!"`);
        if (newState.deck.length > 0) {
          const drawnCard = newState.deck.pop() as Card;
          asker.hand.push(drawnCard);
          turnLog.push(`${asker.name} drew a card.`);
          if (drawnCard.rank === rank) {
            turnLog.push(`It was a ${rank}! ${asker.name} gets another turn.`);
            playerGoesAgain = true;
          }
        } else {
          turnLog.push("The deck is empty!");
        }
      }

      // Check for sets for the asker
      const { updatedPlayer, newSets } = checkForSets(asker);
      newState.players[askerId] = updatedPlayer;
      if (newSets.length > 0) {
        turnLog.push(`${asker.name} completed a set of ${newSets.join(', ')}s!`);
      }

      // Check for game over
      let gameOver = false;
      if (newState.deck.length === 0) {
        // Check if any player has no cards
        if (newState.players.some(p => p.hand.length === 0)) {
           gameOver = true;
        }
      }
      if (updatedPlayer.hand.length === 0) {
         gameOver = true;
      }

      let winner = null;
      if (gameOver) {
        turnLog.push('Game Over!');
        let maxSets = -1;
        newState.players.forEach(p => {
          if (p.sets.length > maxSets) {
            maxSets = p.sets.length;
          }
        });
        const winners = newState.players.filter(p => p.sets.length === maxSets);
        if (winners.length === 1) {
          winner = winners[0];
          turnLog.push(`${winner.name} wins with ${maxSets} sets!`);
        } else {
          turnLog.push(`It's a tie between ${winners.map(w=>w.name).join(' and ')}!`);
        }
      }

      return {
        ...newState,
        gameLog: [...newState.gameLog, ...turnLog],
        currentTurnActions: turnLog,
        currentPlayerIndex: playerGoesAgain ? askerId : (askerId + 1) % newState.players.length,
        isGameOver: gameOver,
        winner: winner,
      };
    });
  }, []);

  const humanPlayerAction = useCallback((targetId: number, rank: Rank) => {
    if (gameState?.currentPlayerIndex === 0 && !isThinking) {
      processTurn(0, targetId, rank);
    }
  }, [gameState, isThinking, processTurn]);

  useEffect(() => {
    if (!gameState || gameState.isGameOver) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isAI) {
      setIsThinking(true);
      const timeoutId = setTimeout(async () => {
        try {
          if (currentPlayer.hand.length === 0) {
             // AI has no cards, their turn is skipped
             setGameState(gs => gs ? ({...gs, currentPlayerIndex: (gs.currentPlayerIndex + 1) % gs.players.length}) : null);
             setIsThinking(false);
             return;
          }

          const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);
          const decision = await getAIDecision(currentPlayer, otherPlayers, gameState.gameLog);
          processTurn(currentPlayer.id, decision.targetPlayerId, decision.rank);
        } catch (error) {
          console.error("Error during AI turn:", error);
        } finally {
          setIsThinking(false);
        }
      }, AI_THINKING_TIME);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentPlayerIndex, gameState?.isGameOver]);

  return { gameState, isThinking, humanPlayerAction, startGame };
};
import { useReducer, useCallback } from 'react';
import { GameState, GameAction, Player, Card, Rank, PlayerStats } from '../types';
import { PLAYER_CONFIG, INITIAL_HAND_SIZE } from '../game/constants';
import { createDeck, shuffleDeck } from '../game/deck';

// --- Helper functions for grammatically correct logs ---
const getPossessive = (name: string): string => {
    if (name === 'You') return 'your';
    return `${name}'s`;
};

const getVerbIsAre = (name: string): string => {
    return name === 'You' ? 'are' : 'is';
};

const getVerbGetsGet = (name: string): string => {
    return name === 'You' ? 'get' : 'gets';
};
// --- End Helper functions ---

const initialState: GameState = {
  deck: [],
  players: [],
  currentPlayerIndex: 0,
  gameLog: [],
  isGameOver: false,
  winner: null,
  phase: 'INIT',
  askHistory: [],
  lastAction: null,
  animationState: null,
};

// --- Stat Persistence ---
const STATS_STORAGE_KEY = 'go-fish-player-stats';

const getPlayerStats = (): Record<string, PlayerStats> => {
    try {
        const statsJson = localStorage.getItem(STATS_STORAGE_KEY);
        return statsJson ? JSON.parse(statsJson) : {};
    } catch (e) {
        console.error("Failed to parse player stats from localStorage", e);
        return {};
    }
};

const savePlayerStats = (stats: Record<string, PlayerStats>) => {
    try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error("Failed to save player stats to localStorage", e);
    }
};

const defaultStats: PlayerStats = { wins: 0, losses: 0, winStreak: 0, lossStreak: 0 };
// --- End Stat Persistence ---


const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME': {
      const { playerAvatarUrl, playerName } = action.payload;
      const allStats = getPlayerStats();
      const deck = shuffleDeck(createDeck());
      
      const players: Player[] = PLAYER_CONFIG.map(config => {
        const finalPlayerName = config.isHuman ? playerName : config.name;
        const playerStats = allStats[finalPlayerName] || { ...defaultStats };

        const playerConfig: Player = {
          ...config,
          hand: [],
          books: [],
          name: finalPlayerName,
          avatarUrl: config.isHuman ? playerAvatarUrl : config.avatarUrl,
          stats: playerStats,
        };
        return playerConfig;
      });

      for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
        for (const player of players) {
          const card = deck.pop();
          if (card) player.hand.push(card);
        }
      }

      // Check for initial books without animation
      players.forEach(player => {
        const booksMade = checkForBooks(player.hand);
        booksMade.forEach(book => {
            player.books.push(book.rank);
            player.hand = player.hand.filter(card => card.rank !== book.rank);
        });
      });
      
      const firstPlayer = players[0];

      return {
        ...initialState,
        deck,
        players,
        gameLog: [`Game started! It's ${getPossessive(firstPlayer.name)} turn.`],
        phase: players[0].isHuman ? 'PLAYER_TURN' : 'AI_TURN',
        lastAction: null,
      };
    }

    case 'ASK_CARD': {
        const { askerId, targetId, rank } = action.payload;
        const asker = state.players.find(p => p.id === askerId)!;
        const target = state.players.find(p => p.id === targetId)!;
        
        const logMessage = `${asker.name} asked ${target.name} for ${rank}s.`;

        return {
            ...state,
            phase: 'ANIMATING',
            animationState: {
                type: 'ask',
                fromId: askerId,
                toId: targetId,
            },
            lastAction: {
                type: 'EVALUATE_ASK',
                payload: action.payload,
            },
            gameLog: [...state.gameLog, logMessage],
        };
    }
    
    case 'EVALUATE_ASK': {
        const { askerId, targetId, rank } = action.payload;
        const target = state.players.find(p => p.id === targetId)!;
        const matchingCards = target.hand.filter(c => c.rank === rank);

        if (matchingCards.length > 0) {
            return { 
                ...state, 
                phase: 'ANIMATING', 
                animationState: { type: 'give', cards: matchingCards, fromId: targetId, toId: askerId },
                lastAction: { type: 'GIVE_CARDS', payload: { fromId: targetId, toId: askerId, rank, cards: matchingCards } }, 
            };
        } else {
            return { 
                ...state, 
                phase: 'ANIMATING', 
                lastAction: { type: 'GO_FISH', payload: { askerId, targetId, rank } }, 
            };
        }
    }

    case 'GIVE_CARDS': {
        const { fromId, toId, rank, cards } = action.payload;
        const players = state.players.map(p => {
            if (p.id === fromId) {
                return { ...p, hand: p.hand.filter(c => !cards.some(card => card.id === c.id)) };
            }
            if (p.id === toId) {
                return { ...p, hand: [...p.hand, ...cards] };
            }
            return p;
        });
        
        const toPlayer = players.find(p => p.id === toId)!;
        const fromPlayer = players.find(p => p.id === fromId)!;

        const logMessage = `${fromPlayer.name} gave ${cards.length} ${rank}(s) to ${toPlayer.name}. ${getPossessive(toPlayer.name)} turn again.`;
        
        return { 
            ...state,
            players,
            askHistory: [...state.askHistory, { askerId: toId, targetId: fromId, rank, successful: true }],
            gameLog: [...state.gameLog, logMessage],
            lastAction: { type: 'CHECK_BOOKS', payload: { playerId: toId } }
        };
    }

    case 'GO_FISH': {
        const { askerId, targetId, rank } = action.payload;
        const asker = state.players.find(p => p.id === askerId)!;
        const target = state.players.find(p => p.id === targetId)!;
        const drawnCard = state.deck.length > 0 ? state.deck[state.deck.length - 1] : null;

        const logMessage = `${target.name} said "Go Fish!". ${asker.name} ${getVerbIsAre(asker.name)} drawing a card.`;
        const updatedHistory = [...state.askHistory, { askerId, targetId, rank, successful: false }];

        if (!drawnCard) {
            const emptyDeckLog = [...state.gameLog, logMessage, `The deck is empty!`];
            const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            return { ...state, phase: 'ANIMATING', gameLog: emptyDeckLog, askHistory: updatedHistory, lastAction: { type: 'END_TURN', payload: { nextPlayerIndex } } };
        }
        
        return {
            ...state,
            phase: 'ANIMATING',
            animationState: { type: 'draw', cards: [drawnCard], fromId: 'deck', toId: askerId },
            askHistory: updatedHistory,
            gameLog: [...state.gameLog, logMessage],
            lastAction: { type: 'DRAW_CARD', payload: { playerId: askerId, card: drawnCard, askedRank: rank } }
        };
    }

    case 'DRAW_CARD': {
        const { playerId, card, askedRank } = action.payload;
        if (!card) {
            const logMessage = `The deck is empty!`;
            const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            return { ...state, gameLog: [...state.gameLog, logMessage], lastAction: { type: 'END_TURN', payload: { nextPlayerIndex } } };
        }

        const players = state.players.map(p => p.id === playerId ? { ...p, hand: [...p.hand, card] } : p);
        const player = players.find(p => p.id === playerId)!;
        const deck = state.deck.slice(0, -1);

        if (card.rank === askedRank) {
            const logMessage = `${player.name} drew a ${card.rank} and ${getVerbGetsGet(player.name)} another turn!`;
            return { ...state, players, deck, gameLog: [...state.gameLog, logMessage], lastAction: { type: 'CHECK_BOOKS', payload: { playerId } } };
        } else {
            const logMessage = `${player.name} drew a card. Turn ends.`;
            return { ...state, players, deck, gameLog: [...state.gameLog, logMessage], lastAction: { type: 'CHECK_BOOKS', payload: { playerId: player.id } } };
        }
    }

    case 'CHECK_BOOKS': {
        const { playerId } = action.payload;
        const player = state.players.find(p => p.id === playerId)!;
        const booksMade = checkForBooks(player.hand);
        
        if (booksMade.length > 0) {
            const firstBook = booksMade[0];
            return { 
                ...state, 
                phase: 'ANIMATING',
                animationState: { type: 'book', cards: firstBook.cards, fromId: playerId, toId: playerId, rank: firstBook.rank },
                lastAction: { type: 'FORM_BOOK', payload: { playerId, rank: firstBook.rank, cards: firstBook.cards } } 
            };
        }
        
        const prevAction = state.lastAction;
        if(prevAction?.type === 'DRAW_CARD' && prevAction.payload.card?.rank !== prevAction.payload.askedRank){
            const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            return { ...state, lastAction: { type: 'END_TURN', payload: { nextPlayerIndex } }};
        } else {
            const nextPhase = state.players[state.currentPlayerIndex].isHuman ? 'PLAYER_TURN' : 'AI_TURN';
            return { ...state, phase: nextPhase, lastAction: null };
        }
    }

    case 'FORM_BOOK': {
        const { playerId, rank } = action.payload;
        const players = state.players.map(p => {
            if (p.id === playerId) {
                return { ...p, hand: p.hand.filter(c => c.rank !== rank), books: [...p.books, rank] };
            }
            return p;
        });
        const player = players.find(p => p.id === playerId)!;
        
        const logMessage = `${player.name} made a book of ${rank}s!`;
        const newState = { ...state, players, gameLog: [...state.gameLog, logMessage] };
        
        return { ...newState, lastAction: { type: 'CHECK_BOOKS', payload: { playerId } } };
    }

    case 'END_TURN': {
      const { nextPlayerIndex } = action.payload;
      
      const isGameOver = state.players.some(p => p.hand.length === 0) || state.deck.length === 0;
      if (isGameOver) {
          let playersByScore = [...state.players].sort((a,b) => b.books.length - a.books.length);
          const winner = playersByScore[0].books.length > (playersByScore[1]?.books.length ?? -1) ? playersByScore[0] : null;
          return { ...state, phase: 'ANIMATING', lastAction: { type: 'GAME_OVER', payload: { winner } } };
      }

      const nextPlayer = state.players[nextPlayerIndex];
      const logMessage = `It's now ${getPossessive(nextPlayer.name)} turn.`;
      
      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        phase: nextPlayer.isHuman ? 'PLAYER_TURN' : 'AI_TURN',
        gameLog: [...state.gameLog, logMessage]
      };
    }
    
    case 'GAME_OVER': {
        const { winner } = action.payload;
        const allStats = getPlayerStats();

        const playersWithNewStats = state.players.map(player => {
            const currentStats = player.stats;
            let updatedStats: PlayerStats;

            if (winner) {
                if (player.id === winner.id) { // Winner
                    updatedStats = { ...currentStats, wins: currentStats.wins + 1, winStreak: currentStats.winStreak + 1, lossStreak: 0 };
                } else { // Loser
                    updatedStats = { ...currentStats, losses: currentStats.losses + 1, winStreak: 0, lossStreak: currentStats.lossStreak + 1 };
                }
            } else { // Tie
                updatedStats = { ...currentStats, winStreak: 0, lossStreak: 0 };
            }
            allStats[player.name] = updatedStats;
            return { ...player, stats: updatedStats };
        });

        savePlayerStats(allStats);

        const finalWinner = winner ? playersWithNewStats.find(p => p.id === winner.id) || null : null;

        return {
            ...state,
            phase: 'GAME_OVER',
            isGameOver: true,
            winner: finalWinner,
            players: playersWithNewStats,
        };
    }
    
    case 'ANIMATION_COMPLETE': {
        let currentState = { ...state, animationState: null };
        let actionToProcess = currentState.lastAction;

        if (!actionToProcess) {
            const currentPlayer = currentState.players[currentState.currentPlayerIndex];
            return { ...currentState, phase: currentPlayer.isHuman ? 'PLAYER_TURN' : 'AI_TURN' };
        }
        
        let nextState = gameReducer(currentState, actionToProcess);

        while(
            nextState.lastAction &&
            nextState.phase !== 'PLAYER_TURN' && 
            nextState.phase !== 'AI_TURN' && 
            nextState.phase !== 'ANIMATING' &&
            nextState.phase !== 'GAME_OVER'
        ) {
            const currentAction = nextState.lastAction;
            nextState = gameReducer(nextState, currentAction);
            if (nextState.lastAction === currentAction) break; // Prevent infinite loops
        }
        
        return nextState;
    }

    default:
      return state;
  }
};


const checkForBooks = (hand: Card[]): {rank: Rank, cards: Card[]}[] => {
    const rankCounts = hand.reduce((acc, card) => {
      acc[card.rank] = (acc[card.rank] || 0) + 1;
      return acc;
    }, {} as Record<Rank, number>);
  
    const books: {rank: Rank, cards: Card[]}[] = [];
    for (const rank in rankCounts) {
      if (rankCounts[rank as Rank] === 4) {
        books.push({
            rank: rank as Rank,
            cards: hand.filter(c => c.rank === rank)
        });
      }
    }
    return books;
};

export const useGoFish = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startGame = useCallback((playerAvatarUrl: string, playerName: string) => {
    dispatch({ type: 'START_GAME', payload: { playerAvatarUrl, playerName } });
  }, []);
  
  return { state, dispatch, startGame };
};
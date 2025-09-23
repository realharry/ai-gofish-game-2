
import { SUITS, RANKS, PLAYER_NAMES, INITIAL_HAND_SIZE } from '../constants';
import { Card, GameState, Player, AIModel, Rank } from '../types';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const initializeGame = (): GameState => {
  let deck = shuffleDeck(createDeck());
  const players: Player[] = PLAYER_NAMES.map((name, index) => ({
    id: `player-${index}`,
    name,
    hand: [],
    books: [],
    isAI: index !== 0,
    aiModel: AIModel.Gemini, // Default model
  }));

  for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
    for (const player of players) {
        if(deck.length > 0) {
            player.hand.push(deck.pop()!);
        }
    }
  }
  
  // Initial book check
  players.forEach(player => {
    checkForBooks(player);
  });

  return {
    deck,
    players,
    currentPlayerIndex: 0,
    gameLog: ['Game started! Welcome.'],
    isGameOver: false,
    winner: null,
    history: [],
  };
};

export const checkForBooks = (player: Player): Rank[] => {
    const rankCounts: { [key in Rank]?: number } = {};
    for (const card of player.hand) {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }

    const newBooks: Rank[] = [];
    for (const rank in rankCounts) {
        if (rankCounts[rank as Rank] === 4) {
            player.books.push(rank as Rank);
            newBooks.push(rank as Rank);
            player.hand = player.hand.filter(card => card.rank !== rank);
        }
    }
    return newBooks;
};

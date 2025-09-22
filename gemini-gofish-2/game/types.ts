
export enum Suit {
  Hearts = '♥',
  Diamonds = '♦',
  Clubs = '♣',
  Spades = '♠',
}

export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export enum AIStrategy {
  Random = 'Random Bot',
  Memory = 'Memory Bot',
  Targeted = 'Targeted Bot',
}

export interface Player {
  id: number;
  name: string;
  hand: Card[];
  sets: Rank[];
  isAI: boolean;
  strategy?: AIStrategy;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  currentPlayerIndex: number;
  gameLog: string[];
  isGameOver: boolean;
  winner: Player | null;
  currentTurnActions: string[];
}
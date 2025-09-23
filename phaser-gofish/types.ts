
export enum Suit {
  Hearts = '♥',
  Diamonds = '♦',
  Clubs = '♣',
  Spades = '♠',
}

export enum Rank {
  Ace = 'A',
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  books: Rank[];
  isAI: boolean;
  aiModel: AIModel;
}

export interface GameState {
  deck: Card[];
  players: Player[];
  currentPlayerIndex: number;
  gameLog: string[];
  isGameOver: boolean;
  winner: Player | null;
  history: TurnRecord[];
}

export enum AIModel {
    Gemini = "Gemini",
    Greedy = "Greedy",
    Random = "Random"
}

export interface TurnRecord {
    askerId: string;
    targetId: string;
    rank: Rank;
    wasSuccessful: boolean;
    drewCard?: Card | null;
}

export interface AIAction {
    playerToAskId: string;
    rankToAsk: Rank;
}

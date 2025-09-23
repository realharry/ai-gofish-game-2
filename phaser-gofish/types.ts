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

export enum GameSpeed {
    Slow = "Slow",
    Normal = "Normal",
    Fast = "Fast",
}

export enum CardBack {
    Default = 'Default',
    Galaxy = 'Galaxy',
    Forest = 'Forest',
    Ocean = 'Ocean',
}

export enum Theme {
    DarkBlue = 'Dark Blue',
    Charcoal = 'Charcoal',
    Forest = 'Forest',
    Purple = 'Purple',
}

export interface GameState {
  deck: Card[];
  players: Player[];
  currentPlayerIndex: number;
  gameLog: string[];
  isGameOver: boolean;
  winner: Player | null;
  history: TurnRecord[];
  gameSpeed: GameSpeed;
  cardBack: CardBack;
  theme: Theme;
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
    transferredCards?: Card[];
}

export interface AIAction {
    playerToAskId: string;
    rankToAsk: Rank;
}
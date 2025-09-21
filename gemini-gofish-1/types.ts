export type Suit = '♥' | '♦' | '♣' | '♠';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export enum AIType {
  Memory = 'Memory',
  Random = 'Random',
  Aggressive = 'Aggressive'
}

export interface PlayerStats {
  wins: number;
  losses: number;
  winStreak: number;
  lossStreak: number;
}

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  hand: Card[];
  books: Rank[];
  aiType?: AIType;
  avatarUrl: string;
  stats: PlayerStats;
}

export interface AskRecord {
  askerId: number;
  targetId: number;
  rank: Rank;
  successful: boolean;
}

export type AnimationType = 'give' | 'draw' | 'book' | 'ask';

export interface AnimationState {
  type: AnimationType;
  cards?: Card[];
  fromId: number | 'deck'; // player ID or 'deck'
  toId: number;
  rank?: Rank; // for books
}


export interface GameState {
  deck: Card[];
  players: Player[];
  currentPlayerIndex: number;
  gameLog: string[];
  isGameOver: boolean;
  winner: Player | null;
  phase: 'INIT' | 'PLAYER_TURN' | 'AI_TURN' | 'ANIMATING' | 'GAME_OVER';
  askHistory: AskRecord[];
  lastAction: GameAction | null;
  animationState: AnimationState | null;
}

export type GameAction =
  | { type: 'START_GAME'; payload: { playerAvatarUrl: string; playerName: string } }
  | { type: 'ASK_CARD'; payload: { askerId: number; targetId: number; rank: Rank } }
  | { type: 'EVALUATE_ASK'; payload: { askerId: number; targetId: number; rank: Rank } }
  | { type: 'GIVE_CARDS'; payload: { fromId: number; toId: number; rank: Rank; cards: Card[] } }
  | { type: 'GO_FISH'; payload: { askerId: number; targetId: number; rank: Rank } }
  | { type: 'DRAW_CARD'; payload: { playerId: number; card: Card | null; askedRank: Rank | null } }
  | { type: 'CHECK_BOOKS'; payload: { playerId: number } }
  | { type: 'FORM_BOOK'; payload: { playerId: number; rank: Rank; cards: Card[] } }
  | { type: 'END_TURN'; payload: { nextPlayerIndex: number } }
  | { type: 'GAME_OVER'; payload: { winner: Player | null } }
  | { type: 'ANIMATION_COMPLETE'; };

export type GameDispatch = React.Dispatch<GameAction>;
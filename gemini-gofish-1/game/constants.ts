import { Suit, Rank, AIType } from '../types';

export const SUITS: Suit[] = ['♥', '♦', '♣', '♠'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const PLAYER_CONFIG = [
  { id: 0, name: 'You', isHuman: true, avatarUrl: '' },
  { id: 1, name: 'Memo', isHuman: false, aiType: AIType.Memory, avatarUrl: 'https://api.dicebear.com/8.x/bottts-neutral/svg?seed=Memo&backgroundColor=cyan' },
  { id: 2, name: 'Rando', isHuman: false, aiType: AIType.Random, avatarUrl: 'https://api.dicebear.com/8.x/bottts-neutral/svg?seed=Rando&backgroundColor=purple' },
  { id: 3, name: 'Aggro', isHuman: false, aiType: AIType.Aggressive, avatarUrl: 'https://api.dicebear.com/8.x/bottts-neutral/svg?seed=Aggro&backgroundColor=emerald' },
];

export const INITIAL_HAND_SIZE = 5;
export const AI_THINKING_TIME = 1500; // ms
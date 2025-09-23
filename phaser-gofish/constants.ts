
import { Suit, Rank } from './types';

export const SUITS: Suit[] = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
export const RANKS: Rank[] = [
  Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven,
  Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King,
];

export const PLAYER_NAMES = ['You', 'Bot Alice', 'Bot Bob', 'Bot Charles'];
export const INITIAL_HAND_SIZE = 5;

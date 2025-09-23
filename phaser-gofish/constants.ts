import { Suit, Rank, GameSpeed } from './types';

export const SUITS: Suit[] = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
export const RANKS: Rank[] = [
  Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven,
  Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King,
];

export const PLAYER_NAMES = ['You', 'Bot Alice', 'Bot Bob', 'Bot Charles'];
export const INITIAL_HAND_SIZE = 5;

export const GAME_SPEED_DELAYS: Record<GameSpeed, number> = {
  [GameSpeed.Slow]: 1500,
  [GameSpeed.Normal]: 750,
  [GameSpeed.Fast]: 375,
};

export const ANIMATION_DURATIONS: Record<GameSpeed, number> = {
  [GameSpeed.Slow]: 1200,
  [GameSpeed.Normal]: 800,
  [GameSpeed.Fast]: 500,
};
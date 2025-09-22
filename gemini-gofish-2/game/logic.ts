import { Rank, Suit, Card, Player, AIStrategy, GameState } from './types';

export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS: Suit[] = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];

export const createDeck = (): Card[] => {
  return SUITS.flatMap(suit =>
    RANKS.map(rank => ({ suit, rank, id: `${rank}-${suit}` }))
  );
};

export const shuffleDeck = <T,>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

export const checkForSets = (player: Player): { updatedPlayer: Player; newSets: Rank[] } => {
  const rankCounts = player.hand.reduce((acc, card) => {
    acc[card.rank] = (acc[card.rank] || 0) + 1;
    return acc;
  }, {} as Record<Rank, number>);

  const newSets: Rank[] = [];
  let updatedHand = [...player.hand];

  for (const rank in rankCounts) {
    if (rankCounts[rank as Rank] === 4) {
      newSets.push(rank as Rank);
      updatedHand = updatedHand.filter(card => card.rank !== rank);
    }
  }
  
  const updatedPlayer = {
      ...player,
      hand: updatedHand,
      sets: [...player.sets, ...newSets]
  };

  return { updatedPlayer, newSets };
};

export const initializeGame = (): GameState => {
  const players: Player[] = [
    { id: 0, name: 'You', hand: [], sets: [], isAI: false, avatarId: 'user' },
    { id: 1, name: 'Ava (Memory)', hand: [], sets: [], isAI: true, strategy: AIStrategy.Memory, avatarId: 'memory' },
    { id: 2, name: 'Bob (Random)', hand: [], sets: [], isAI: true, strategy: AIStrategy.Random, avatarId: 'random' },
    { id: 3, name: 'Charlie (Targeted)', hand: [], sets: [], isAI: true, strategy: AIStrategy.Targeted, avatarId: 'targeted' },
  ];

  let deck = shuffleDeck(createDeck());
  const initialHandSize = 5;

  for (let i = 0; i < initialHandSize; i++) {
    for (const player of players) {
      const card = deck.pop();
      if (card) {
        player.hand.push(card);
      }
    }
  }

  // Check for initial sets after dealing
  players.forEach(p => {
    const { updatedPlayer } = checkForSets(p);
    p.hand = updatedPlayer.hand;
    p.sets = updatedPlayer.sets;
  });

  return {
    players,
    deck,
    currentPlayerIndex: 0,
    gameLog: ['Game started! Welcome to Go Fish.'],
    isGameOver: false,
    winner: null,
    currentTurnActions: [],
  };
};

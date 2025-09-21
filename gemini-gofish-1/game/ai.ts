
import { GameState, Player, Rank, AIType, AskRecord } from '../types';

interface AIMove {
  targetId: number;
  rank: Rank;
}

export const getAIMove = (gameState: GameState, aiPlayer: Player): AIMove | null => {
  if (aiPlayer.hand.length === 0) return null;

  switch (aiPlayer.aiType) {
    case AIType.Memory:
      return getMemoryMove(gameState, aiPlayer);
    case AIType.Aggressive:
      return getAggressiveMove(gameState, aiPlayer);
    case AIType.Random:
    default:
      return getRandomMove(gameState, aiPlayer);
  }
};

const getRandomOpponent = (players: Player[], selfId: number): Player => {
  const opponents = players.filter(p => p.id !== selfId && p.hand.length > 0);
  if (opponents.length === 0) return players.find(p => p.id !== selfId)!;
  return opponents[Math.floor(Math.random() * opponents.length)];
};

const getRandomMove = (gameState: GameState, aiPlayer: Player): AIMove => {
  const target = getRandomOpponent(gameState.players, aiPlayer.id);
  const cardToAsk = aiPlayer.hand[Math.floor(Math.random() * aiPlayer.hand.length)];
  return { targetId: target.id, rank: cardToAsk.rank };
};

const getAggressiveMove = (gameState: GameState, aiPlayer: Player): AIMove => {
  const opponents = gameState.players.filter(p => p.id !== aiPlayer.id);
  if(opponents.every(o => o.hand.length === 0)) return getRandomMove(gameState, aiPlayer);

  let bestTarget = opponents
    .filter(o => o.hand.length > 0)
    .sort((a, b) => b.books.length - a.books.length || b.hand.length - a.hand.length)[0];

  if (!bestTarget) {
     bestTarget = getRandomOpponent(gameState.players, aiPlayer.id);
  }

  const cardToAsk = aiPlayer.hand[Math.floor(Math.random() * aiPlayer.hand.length)];
  return { targetId: bestTarget.id, rank: cardToAsk.rank };
};

const getMemoryMove = (gameState: GameState, aiPlayer: Player): AIMove => {
  // Strategy: Ask for a card I have from someone who I know has it or recently asked for it.
  const myRanks = new Set(aiPlayer.hand.map(c => c.rank));

  // Find a successful ask from another player for a rank I also have.
  for (const rank of myRanks) {
    const successfulAsker = gameState.askHistory.find(
      (ask) => ask.rank === rank && ask.successful && ask.askerId !== aiPlayer.id
    );
    if (successfulAsker) {
      const targetPlayer = gameState.players.find(p => p.id === successfulAsker.askerId);
      if(targetPlayer && targetPlayer.hand.length > 0){
        return { targetId: successfulAsker.askerId, rank };
      }
    }
  }
  
  // Find a player who recently failed to get a card I have. They might have it.
  for (const rank of myRanks) {
     const failedAsker = gameState.askHistory.find(
      (ask) => ask.rank === rank && !ask.successful && ask.askerId !== aiPlayer.id
    );
    if(failedAsker){
      const targetPlayer = gameState.players.find(p => p.id === failedAsker.targetId);
       if(targetPlayer && targetPlayer.hand.length > 0) {
           return { targetId: failedAsker.targetId, rank };
       }
    }
  }

  // If no memory-based move, fallback to random.
  return getRandomMove(gameState, aiPlayer);
};

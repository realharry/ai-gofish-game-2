
import { GoogleGenAI, Type } from "@google/genai";
import { Player, Rank, AIStrategy } from '../game/types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface AIDecision {
  targetPlayerId: number;
  rank: Rank;
}

const getStrategyInstruction = (strategy: AIStrategy): string => {
  switch (strategy) {
    case AIStrategy.Memory:
      return "Your strategy is 'Memory'. Your primary goal is to use the game log to deduce which cards other players might have. Look for these patterns:\n- If a player asked for a card and received it, you know they hold that rank.\n- If a player asked for a card and was told 'Go Fish!', you know the opponent they asked does NOT have that rank.\nUse this information to make the most logical request.";
    case AIStrategy.Targeted:
      return "Your strategy is 'Targeted'. Prioritize completing your own sets. Ask for ranks you already hold, especially if you have multiples. Target players with more cards.";
    case AIStrategy.Random:
    default:
      return "Your strategy is 'Random'. Make a random but valid choice. Pick a random player to ask and a random rank from your hand.";
  }
};

export const getAIDecision = async (
  currentPlayer: Player,
  otherPlayers: Player[],
  gameLog: string[],
): Promise<AIDecision> => {
  
  const availableRanks = [...new Set(currentPlayer.hand.map(c => c.rank))];
  const availableTargets = otherPlayers.map(p => ({id: p.id, name: p.name, cardCount: p.hand.length, sets: p.sets.length}));
  
  const prompt = `
    You are an AI player in a game of Go Fish. It's your turn to ask another player for a card.
    
    Your Info:
    - Name: ${currentPlayer.name}
    - Your hand contains ranks: ${availableRanks.join(', ')}
    - Your current sets: ${currentPlayer.sets.join(', ') || 'None'}
    
    Other Players:
    ${availableTargets.map(p => `- ${p.name} (ID: ${p.id}) has ${p.cardCount} cards and ${p.sets} sets.`).join('\n')}
    
    Recent Game Log (last 10 actions):
    ${gameLog.slice(-10).join('\n')}

    Your Strategy: ${getStrategyInstruction(currentPlayer.strategy || AIStrategy.Random)}
    
    Based on your hand and strategy, decide which player to ask and for which rank.
    You can only ask for a rank that you already have in your hand.
    You cannot ask yourself.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetPlayerId: { 
              type: Type.NUMBER, 
              description: `The ID of the player to ask. Must be one of: ${availableTargets.map(p=>p.id).join(', ')}` 
            },
            rank: { 
              type: Type.STRING, 
              description: `The rank to ask for. Must be one of: ${availableRanks.join(', ')}` 
            },
          },
          required: ["targetPlayerId", "rank"],
        },
      }
    });

    const decision = JSON.parse(response.text);
    
    // Validate response
    if (availableTargets.some(p => p.id === decision.targetPlayerId) && availableRanks.includes(decision.rank as Rank)) {
      return decision as AIDecision;
    } else {
        throw new Error("Invalid decision from AI");
    }

  } catch (error) {
    console.error("Gemini API call failed, making a random choice:", error);
    // Fallback to random choice on error
    const randomTarget = availableTargets[Math.floor(Math.random() * availableTargets.length)];
    const randomRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];
    return { targetPlayerId: randomTarget.id, rank: randomRank };
  }
};
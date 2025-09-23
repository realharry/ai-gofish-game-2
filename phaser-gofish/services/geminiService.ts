
import { GoogleGenAI, Type } from "@google/genai";
import { Player, Rank, GameState, AIAction, TurnRecord } from '../types';
import { RANKS } from "../constants";


const getAIActionGemini = async (currentPlayer: Player, otherPlayers: Player[], history: TurnRecord[]): Promise<AIAction> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const possibleRanksToAsk = [...new Set(currentPlayer.hand.map(card => card.rank))];
    const possibleTargets = otherPlayers.map(p => p.id);

    const historySummary = history.slice(-10).map(turn => 
        `- ${turn.askerId} asked ${turn.targetId} for ${turn.rank}. Success: ${turn.wasSuccessful}.`
    ).join('\n');

    const prompt = `
You are an expert Go Fish player named ${currentPlayer.name}. Your goal is to collect the most books (sets of 4 cards of the same rank).
It's your turn. Analyze the game state and decide on the best move.

**Your Current Hand:**
${currentPlayer.hand.map(c => `${c.rank} of ${c.suit}`).join(', ')}

**Your Collected Books:**
${currentPlayer.books.join(', ') || 'None'}

**Opponents:**
${otherPlayers.map(p => `- ${p.id} (${p.name}) has ${p.books.length} books.`).join('\n')}

**Possible Ranks You Can Ask For:**
${possibleRanksToAsk.join(', ')}

**Recent Game History (last 10 turns):**
${historySummary || 'No history yet.'}

**Your Task:**
Based on your hand and the game history, decide which player to ask and for which rank. A good strategy involves asking for a rank you already hold, and remembering what other players have asked for.
Choose one player ID from [${possibleTargets.join(', ')}] and one rank from [${possibleRanksToAsk.join(', ')}].
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
                        playerToAskId: { type: Type.STRING, description: `The ID of the player to ask. Must be one of: ${possibleTargets.join(', ')}`},
                        rankToAsk: { type: Type.STRING, description: `The rank to ask for. Must be one of: ${possibleRanksToAsk.join(', ')}`},
                        reasoning: { type: Type.STRING, description: "A brief explanation of your choice."}
                    },
                    required: ["playerToAskId", "rankToAsk"],
                }
            }
        });

        const jsonText = response.text.trim();
        const action = JSON.parse(jsonText) as {playerToAskId: string, rankToAsk: Rank};

        // Validate response
        if (possibleTargets.includes(action.playerToAskId) && possibleRanksToAsk.includes(action.rankToAsk)) {
            return action;
        }
        // Fallback to random if Gemini response is invalid
        return getAIActionRandom(currentPlayer, otherPlayers);

    } catch (error: any) {
        const errorMessage = String(error?.message || error);
        if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
            console.warn("Gemini API quota exceeded. Falling back to simpler AI strategy for this turn.");
        } else {
            console.error("Error calling Gemini API, falling back to random action:", error);
        }
        return getAIActionRandom(currentPlayer, otherPlayers);
    }
};

const getAIActionGreedy = (currentPlayer: Player, otherPlayers: Player[]): AIAction => {
    const rankCounts: { [key in Rank]?: number } = {};
    for (const card of currentPlayer.hand) {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }

    let maxCount = 0;
    let rankToAsk: Rank | null = null;
    for (const rank in rankCounts) {
        if (rankCounts[rank as Rank]! > maxCount) {
            maxCount = rankCounts[rank as Rank]!;
            rankToAsk = rank as Rank;
        }
    }
    
    if(!rankToAsk || currentPlayer.hand.length === 0){
       return getAIActionRandom(currentPlayer, otherPlayers);
    }
    
    const randomOpponentId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
    return { playerToAskId: randomOpponentId, rankToAsk };
};


const getAIActionRandom = (currentPlayer: Player, otherPlayers: Player[]): AIAction => {
    if(currentPlayer.hand.length === 0){
        // This should not happen if game ends correctly, but as a fallback
        return {playerToAskId: otherPlayers[0].id, rankToAsk: RANKS[0]};
    }
    const randomCardFromHand = currentPlayer.hand[Math.floor(Math.random() * currentPlayer.hand.length)];
    const rankToAsk = randomCardFromHand.rank;
    const randomOpponentId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;

    return { playerToAskId: randomOpponentId, rankToAsk };
};

export const getAIAction = (
    currentPlayer: Player,
    otherPlayers: Player[],
    history: TurnRecord[]
): Promise<AIAction> => {
    switch (currentPlayer.aiModel) {
        case "Gemini":
            return getAIActionGemini(currentPlayer, otherPlayers, history);
        case "Greedy":
            return Promise.resolve(getAIActionGreedy(currentPlayer, otherPlayers));
        case "Random":
        default:
            return Promise.resolve(getAIActionRandom(currentPlayer, otherPlayers));
    }
};
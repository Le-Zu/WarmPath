import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const calculateBatchWarmthScores = async (pathsMetadata: any[]) => {
    if (!pathsMetadata || pathsMetadata.length === 0) return [];
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const pathsPrompt = pathsMetadata.map((metadata, index) => `
            PATH ${index + 1}:
            - INTENT: ${metadata.intentFilter}
            - Requester to Connector: "${metadata.requesterToConnector || 'Unknown'}"
            - Connector to Target: "${metadata.connectorToTarget || 'Unknown'}"
            - Target Bio: ${metadata.targetBio || 'No bio'}
            - Target Interests: ${metadata.targetInterests || 'No interests'}
        `).join('\n');

        const prompt = `
            Role: You are a professional networking assistant assessing multiple "Two-Hop" connections.
            Task: Rate the relevance of each Target user to the Requester's intent on a scale of 1-5.

            ---
            PATHS TO SCORE:
            ${pathsPrompt}
            ---

            SCORING CRITERIA:
            1: No relevance.
            2: Peripheral relevance.
            3: Moderate relevance.
            4: High relevance.
            5: Exact match.

            Respond ONLY with a JSON array of numbers representing the scores for each path in order. 
            Example: [3, 5, 2]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Clean up the response if it contains markdown code blocks
        const jsonStr = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        return JSON.parse(jsonStr);
    } catch (error: any) {
        console.error('[GeminiService] Batch calculation failed:', error);
        throw error;
    }
};

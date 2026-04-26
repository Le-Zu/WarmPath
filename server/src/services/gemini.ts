import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
    console.error('\x1b[31m[GeminiService] ❌ ERROR: GEMINI_API_KEY is missing in server/.env\x1b[0m');
}
const genAI = new GoogleGenerativeAI(apiKey);

// Simple in-memory cache: Map<hash, score>
const scoreCache = new Map<string, number | string>();

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const getMetadataHash = (m: any) => {
    const str = `${m.intentFilter}-${m.requesterToConnector}-${m.connectorToTarget}-${m.targetBio}-${m.targetInterests}`;
    return crypto.createHash('md5').update(str).digest('hex');
};

export const calculateBatchWarmthScores = async (pathsMetadata: any[], retryCount = 0): Promise<any[]> => {
    if (!pathsMetadata || pathsMetadata.length === 0) {
        console.log('[GeminiService] No metadata provided, skipping.');
        return [];
    }

    console.log(`[GeminiService] Processing batch of ${pathsMetadata.length} paths (retry: ${retryCount})`);

    // Check cache first
    const results = new Array(pathsMetadata.length).fill(null);
    const indicesToFetch: number[] = [];

    pathsMetadata.forEach((m, i) => {
        const hash = getMetadataHash(m);
        if (scoreCache.has(hash)) {
            console.log(`[GeminiService] Cache hit for path index ${i}`);
            results[i] = scoreCache.get(hash);
        } else {
            indicesToFetch.push(i);
        }
    });

    if (indicesToFetch.length === 0) {
        console.log('[GeminiService] All paths found in cache.');
        return results;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const metadataToFetch = indicesToFetch.map(i => pathsMetadata[i]);

        const pathsPrompt = metadataToFetch.map((m, index) => `
            PATH ${index + 1}:
            - INTENT: ${m.intentFilter}
            - Requester to Connector: "${m.requesterToConnector || 'Unknown'}"
            - Connector to Target: "${m.connectorToTarget || 'Unknown'}"
            - Target Bio: ${m.targetBio || 'No bio'}
            - Target Interests: ${m.targetInterests || 'No interests'}
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

        console.log('[GeminiService] Sending request to Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        console.log(`[GeminiService] SUCCESS: Received response (${text.length} chars)`);
        console.log('[GeminiService] Raw text:', text);
        
        const jsonStr = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
        let newScores;
        try {
            newScores = JSON.parse(jsonStr);
            if (!Array.isArray(newScores)) throw new Error('Response is not an array');
        } catch (parseError: any) {
            console.error('[GeminiService] PARSE ERROR: Failed to parse JSON from AI response.');
            console.error('[GeminiService] Invalid JSON String:', jsonStr);
            console.error('[GeminiService] Error Details:', parseError.message || parseError);
            return results.map(r => r ?? "N/A");
        }
        
        indicesToFetch.forEach((originalIndex, fetchIndex) => {
            const score = newScores[fetchIndex];
            results[originalIndex] = score;
            scoreCache.set(getMetadataHash(pathsMetadata[originalIndex]), score);
        });

        console.log('[GeminiService] Batch processing complete. Scores cached.');
        return results;
    } catch (error: any) {
        console.error('------------------------------------------------------------');
        console.error('[GeminiService] API ERROR ENCOUNTERED');
        console.error(`[GeminiService] Status: ${error.status || 'Unknown'}`);
        console.error(`[GeminiService] Message: ${error.message || 'No message provided'}`);
        
        if (error.errorDetails) {
            console.error('[GeminiService] Detailed Error Info:', JSON.stringify(error.errorDetails, null, 2));
        }
        console.error('------------------------------------------------------------');

        if (error?.status === 429 && retryCount < 1) {
            console.log('[GeminiService] Quota hit (429). Retrying in 2 seconds...');
            await sleep(2000);
            return calculateBatchWarmthScores(pathsMetadata, retryCount + 1);
        }

        return results.map(r => r ?? "N/A");
    }
};

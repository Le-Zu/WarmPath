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
        // ... (existing error logging)
        return results.map(r => r ?? "N/A");
    }
};

/**
 * Deterministic fallback for warmth score (1-5).
 * Weights: 
 * - Shared Interests: +1 or +2
 * - Major Match: +1
 * - Context Match: +1
 */
export const calculateDeterministicWarmScore = (requester: any, target: any, intent: string): number => {
    let score = 1;

    // 1. Shared Interests
    const reqInterests = requester.interests?.map((i: any) => i.category) || [];
    const tgtInterests = target.interests?.map((i: any) => i.category) || [];
    const commonInterests = reqInterests.filter((i: any) => tgtInterests.includes(i));
    
    if (commonInterests.length > 0) score += 1;
    if (commonInterests.length > 2) score += 1;

    // 2. Intent Match
    if (tgtInterests.includes(intent)) {
        score += 1;
    }

    // 3. Academic/Major alignment
    if (requester.major && target.major && requester.major.toLowerCase() === target.major.toLowerCase()) {
        score += 1;
    }

    return Math.min(5, score);
};

export const generateContextPreread = async (subject: any, intent: string): Promise<string> => {
    const fullName = `${subject.first_name} ${subject.last_name}`;
    const majorPart = subject.major ? `majoring in ${subject.major}` : '';
    const yearPart = subject.year ? `a ${subject.year} student` : 'a student';
    
    // Diversify natural opening paragraphs
    const description = [yearPart, majorPart].filter(Boolean).join(' ');
    
    // Templates to make it feel less robotic
    const templates = [
        `${fullName} is ${description}. They are connecting with you regarding ${intent.toLowerCase()}.`,
        `Meet ${fullName}, ${description}. They requested this intro to discuss ${intent.toLowerCase()}.`,
        `${fullName} is ${description}, and they share a mutual interest in ${intent.toLowerCase()} with you.`,
        `You'll be speaking with ${fullName}, ${description}. This connection was made to explore ${intent.toLowerCase()}.`
    ];
    
    // Pick template based on name length to ensure consistency for a user
    const templateIndex = fullName.length % templates.length;
    let paragraph = templates[templateIndex];
    
    const bullets: string[] = [];
    
    // 1. Bio
    if (subject.bio) {
        const cleanBio = subject.bio.length > 150 ? subject.bio.substring(0, 147) + '...' : subject.bio;
        bullets.push(`**About:** ${cleanBio}`);
    }
    
    // 2. Experiences
    if (subject.experiences && subject.experiences.length > 0) {
        const topExps = subject.experiences.slice(0, 2).map((e: any) => {
            const company = e.company ? ` at ${e.company}` : '';
            return `${e.title}${company}`;
        }).join(', ');
        bullets.push(`**Experience:** Has background in ${topExps}.`);
    }
    
    // 3. Interests
    if (subject.interests && subject.interests.length > 0) {
        const topInts = subject.interests.slice(0, 3).map((i: any) => i.label).join(', ');
        bullets.push(`**Interests:** Particularly interested in ${topInts}.`);
    }

    // Default if no details
    if (bullets.length === 0) {
        bullets.push("Ask them about their background and what they're looking to learn during your chat!");
    }

    return `${paragraph}\n\n${bullets.map(b => `* ${b}`).join('\n')}`;
};

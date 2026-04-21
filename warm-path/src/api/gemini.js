import apiFetch from './client.js';

/**
 * Handles errors specifically for Gemini AI assessments, including quota checks.
 */
const handleAssessError = (error) => {
    console.error('[Gemini API] Assessment Error:', error);
    const message = error?.message?.toLowerCase() || "";
    if (message.includes("429") || message.includes("quota") || message.includes("limit")) {
        return "Quota Exceeded";
    }
    return "N/A";
};

/**
 * Sends path metadata to the backend to get warmth scores calculated by Gemini.
 * @param {Array} pathsMetadata - Array of metadata objects for each path.
 * @returns {Promise<Array>} - Array of scores or error labels.
 */
export async function calculateBatchWarmthScores(pathsMetadata) {
    if (!pathsMetadata || pathsMetadata.length === 0) return [];
    
    try {
        const data = await apiFetch('/api/paths/assess', {
            method: 'POST',
            body: JSON.stringify({ pathsMetadata }),
        });
        return data.scores;
    } catch (error) {
        const errorMsg = handleAssessError(error);
        return pathsMetadata.map(() => errorMsg);
    }
}

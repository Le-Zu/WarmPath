import { basePrisma } from '../lib/prisma';
import { getPathsForUser } from './pathDiscovery';
import { calculateBatchWarmthScores, calculateDeterministicWarmScore } from './gemini';

/**
 * Recalculates warmth scores for all paths found for a specific user.
 * This should be triggered when connections or profiles change.
 */
export async function refreshWarmthScoresForUser(userId: string) {
    try {
        // Fetch paths for 'all' intents (or we could loop through categories)
        const paths = await getPathsForUser(userId);
        if (paths.length === 0) return;

        // Fetch user profiles for deterministic scoring fallback
        const requester = await basePrisma.users.findUnique({
            where: { user_id: userId },
            include: { interests: true, experiences: true }
        });

        if (!requester) return;

        const pathsToAssess = [];
        const targetIds = paths.map(p => p.target.id);
        const targets = await basePrisma.users.findMany({
            where: { user_id: { in: targetIds } },
            include: { interests: true, experiences: true }
        });

        const targetMap = new Map(targets.map(t => [t.user_id, t]));

        // Prepare metadata for AI assessment
        const metadata = paths.map(p => ({
            ...p.aiMetadata,
            targetId: p.target.id
        }));

        console.log(`[WarmthScorer] Refreshing ${metadata.length} scores for user ${userId}...`);

        // Try AI first
        let aiScores: (number | string)[] = [];
        try {
            aiScores = await calculateBatchWarmthScores(metadata);
        } catch (err) {
            console.error('[WarmthScorer] AI Assessment failed, using deterministic fallback.');
        }

        // Upsert scores to DB
        const intent = 'all';
        const updates = paths.map((p, i) => {
            const target = targetMap.get(p.target.id);
            let finalScore: number;
            let isAi = false;

            if (typeof aiScores[i] === 'number') {
                finalScore = aiScores[i] as number;
                isAi = true;
            } else {
                finalScore = calculateDeterministicWarmScore(requester, target || {}, intent);
            }

            return basePrisma.warmScores.upsert({
                where: {
                    uq_warm_score: {
                        requester_id: userId,
                        target_id: p.target.id,
                        intent: intent
                    }
                },
                update: {
                    score: finalScore,
                    is_ai_scored: isAi,
                    updated_at: new Date()
                },
                create: {
                    requester_id: userId,
                    target_id: p.target.id,
                    intent: intent,
                    score: finalScore,
                    is_ai_scored: isAi
                }
            });
        });

        await Promise.all(updates);
        console.log(`[WarmthScorer] Successfully updated ${updates.length} scores for user ${userId}.`);
    } catch (error) {
        console.error(`[WarmthScorer] Error refreshing scores for user ${userId}:`, error);
    }
}

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

        const targetIds = paths.map(p => p.target.id);
        const targets = await basePrisma.users.findMany({
            where: { user_id: { in: targetIds } },
            include: { interests: true, experiences: true }
        });

        const targetMap = new Map(targets.map(t => [t.user_id, t]));

        // Identify which paths actually need AI assessment (Token Saving Feature)
        const stalePaths = paths.filter(p => {
            const m = p.aiMetadata;
            if (!m.scoreUpdatedAt) return true; // Never scored

            const scoreTime = new Date(m.scoreUpdatedAt as any).getTime();
            const requesterTime = new Date(requester.updated_at).getTime();
            const connectorTime = new Date(m.connectorUpdatedAt as any).getTime();
            const targetTime = new Date(m.targetUpdatedAt as any).getTime();

            // Refetch if any involved profile has been updated since the last score calculation
            return scoreTime < requesterTime || scoreTime < connectorTime || scoreTime < targetTime;
        });

        const metadataToFetch = stalePaths.map(p => ({
            ...p.aiMetadata,
            targetId: p.target.id
        }));

        console.log(`[WarmthScorer] Found ${paths.length} total paths for user ${userId}.`);
        console.log(`[WarmthScorer] ${metadataToFetch.length} paths require AI recalculation (token-saving active).`);

        // Try AI first for stale paths
        let aiScores: (number | string)[] = [];
        if (metadataToFetch.length > 0) {
            try {
                aiScores = await calculateBatchWarmthScores(metadataToFetch);
            } catch (err) {
                console.error('[WarmthScorer] AI Assessment failed, will use deterministic fallback for stale paths.');
            }
        }

        const aiScoreMap = new Map<string, number>();
        metadataToFetch.forEach((m, i) => {
            if (typeof aiScores[i] === 'number') {
                aiScoreMap.set(m.targetId, aiScores[i] as number);
            }
        });

        // Upsert scores to DB
        const intent = 'all';
        const updates = paths.map((p) => {
            const isStale = stalePaths.some(sp => sp.id === p.id);
            
            // If the path is not stale and we already have a score, skip the DB update
            if (!isStale && p.aiMetadata.scoreUpdatedAt) {
                return null;
            }

            const target = targetMap.get(p.target.id);
            let finalScore: number;
            let isAi = false;
            let sourceLabel = '';

            if (aiScoreMap.has(p.target.id)) {
                finalScore = aiScoreMap.get(p.target.id)!;
                isAi = true;
                sourceLabel = 'AI calculated';
            } else {
                finalScore = calculateDeterministicWarmScore(requester, target || {}, intent);
                sourceLabel = 'deterministic scoring';
            }

            console.log(`[WarmthScorer] Refreshing score for ${p.target.name}: ${finalScore} (${sourceLabel})`);

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
        }).filter(Boolean) as any[];

        if (updates.length > 0) {
            await Promise.all(updates);
            console.log(`[WarmthScorer] Successfully updated ${updates.length} scores for user ${userId}.`);
        } else {
            console.log(`[WarmthScorer] All scores for user ${userId} are up-to-date.`);
        }
    } catch (error) {
        console.error(`[WarmthScorer] Error refreshing scores for user ${userId}:`, error);
    }
}

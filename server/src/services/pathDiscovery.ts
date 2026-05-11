import { basePrisma } from '../lib/prisma'
import { calculateBatchWarmthScores, calculateDeterministicWarmScore } from './gemini';

// Returns two-hop paths for a user, enriched with connector and target profile details.
// When intentFilter is provided, only paths whose target has a matching interest category
// are returned — this drives the intent filter bar on the Paths page.
export async function getPathsForUser(userId: string, intentFilter?: string, performJitRefresh: boolean = false) {
  const intentStr = intentFilter || 'all';
  const rows = await basePrisma.$queryRaw<any[]>`
        SELECT
          v.requester_id,
          v.connector_id,
          v.target_id,
          v.requester_connector_context,
          v.connector_target_context,
          v.avg_connector_score,
          COALESCE(
            ws_specific.score, 
            ws_all.score, 
            ROUND(v.avg_connector_score), 
            1
          ) AS strength,
          CASE 
            WHEN ws_specific.score IS NOT NULL THEN 'database_specific'
            WHEN ws_all.score IS NOT NULL THEN 'database_all'
            WHEN v.avg_connector_score IS NOT NULL THEN 'avg_connector'
            ELSE 'default'
          END AS score_source_internal,
          COALESCE(ws_specific.is_ai_scored, ws_all.is_ai_scored, FALSE) AS is_ai_scored_internal,
          c.first_name  AS connector_first_name,
          c.last_name   AS connector_last_name,
          c.major       AS connector_major,
          c.year        AS connector_year,
          c.bio         AS connector_bio,
          c.updated_at  AS connector_updated_at,
          t.first_name  AS target_first_name,
          t.last_name   AS target_last_name,
          t.major       AS target_major,
          t.year        AS target_year,
          t.bio         AS target_bio,
          t.linkedin_url AS target_linkedin_url,
          t.handshake_url AS target_handshake_url,
          t.updated_at  AS target_updated_at,
          t.profile_picture_url AS target_picture_url,
          t.intent_status AS target_intent_status,
          t.intent_status_expires_at AS target_intent_status_expires_at,
          ps_target.discovery_mode AS target_discovery_mode,
          ws_specific.updated_at AS score_updated_at,
          (SELECT STRING_AGG(label, ', ') FROM user_interests WHERE user_id = v.target_id) AS target_interests
        FROM two_hop_paths_view v
        JOIN users c ON c.user_id = v.connector_id
        JOIN users t ON t.user_id = v.target_id
        LEFT JOIN privacy_settings ps_target ON ps_target.user_id = v.target_id
        -- Try to find the specific intent score first
        LEFT JOIN warm_scores ws_specific ON ws_specific.requester_id = v.requester_id 
             AND ws_specific.target_id = v.target_id 
             AND ws_specific.intent = ${intentStr}
        -- Fallback to the 'all' intent score if specific is missing
        LEFT JOIN warm_scores ws_all ON ws_all.requester_id = v.requester_id 
             AND ws_all.target_id = v.target_id 
             AND ws_all.intent = 'all'
        WHERE v.requester_id = ${userId}
          AND COALESCE(ps_target.discovery_mode, 'full'::discovery_mode) <> 'hidden'::discovery_mode
          AND COALESCE(ps_target.show_in_discovery, TRUE) = TRUE
          AND COALESCE(ps_target.who_can_request, 'connections_of_connections'::request_permission) 
              IN ('anyone'::request_permission, 'connections_of_connections'::request_permission)
          AND (${intentFilter}::text IS NULL OR EXISTS (
            SELECT 1 FROM user_interests ui
            WHERE ui.user_id = v.target_id
              AND ui.category = ${intentFilter}::intent_category
          ))
        ORDER BY strength DESC
        `

        let finalPaths = rows.map((r) => {
          const isAnonymous = r.target_discovery_mode === 'anonymous';
          const targetName = isAnonymous 
            ? `${r.target_first_name} ${r.target_last_name ? r.target_last_name[0] + '.' : ''}`
            : [r.target_first_name, r.target_last_name].filter(Boolean).join(' ');

          return {
            id: `${r.connector_id}-${r.target_id}`,
            connector: {
              id: r.connector_id,
              name: [r.connector_first_name, r.connector_last_name].filter(Boolean).join(' '),
              role: [r.connector_major, r.connector_year].filter(Boolean).join(', ') || null,
              relation: r.requester_connector_context ?? null,
              targetRelation: r.connector_target_context ?? null,
            },
            target: {
              id: r.target_id,
              name: targetName,
              role: [r.target_major, r.target_year].filter(Boolean).join(', ') || null,
              pictureUrl: isAnonymous ? null : (r.target_picture_url ?? null),
        linkedinUrl: isAnonymous ? null : (r.target_linkedin_url ?? null),
        handshakeUrl: isAnonymous ? null : (r.target_handshake_url ?? null),
              isAnonymous,
              // Intent status surfaces only when present, not expired, and the contact isn't anonymous.
              intentStatus: (() => {
                if (isAnonymous || !r.target_intent_status) return null;
                if (r.target_intent_status_expires_at && new Date(r.target_intent_status_expires_at).getTime() <= Date.now()) return null;
                return r.target_intent_status;
              })(),
            },
            strength: Number(r.strength),
            // Metadata block designed for easy AI prompting
            aiMetadata: {
              targetId: r.target_id,
              intentFilter: intentFilter ?? 'all',
              requesterToConnector: r.requester_connector_context,
              connectorToTarget: r.connector_target_context,
              targetInterests: r.target_interests ?? '',
              targetBio: r.target_bio ?? '',
              connectorBio: r.connector_bio ?? '',
              connectorUpdatedAt: r.connector_updated_at,
              targetUpdatedAt: r.target_updated_at,
              scoreUpdatedAt: r.score_updated_at,
              isAiScored: r.is_ai_scored_internal,
              scoreSource: r.score_source_internal
            },
          };
        });

        // JIT Assessment Workflow
        if (performJitRefresh && finalPaths.length > 0) {
            try {
                const requester = await basePrisma.users.findUnique({
                    where: { user_id: userId },
                    include: { interests: true, experiences: true }
                });

                if (requester) {
                    const stalePaths = finalPaths.filter(p => {
                        const m = p.aiMetadata;
                        if (!m.scoreUpdatedAt) return true; // Never scored

                        const scoreTime = new Date(m.scoreUpdatedAt as any).getTime();
                        const requesterTime = new Date(requester.updated_at).getTime();
                        const connectorTime = new Date(m.connectorUpdatedAt as any).getTime();
                        const targetTime = new Date(m.targetUpdatedAt as any).getTime();

                        return scoreTime < requesterTime || scoreTime < connectorTime || scoreTime < targetTime;
                    });

                    if (stalePaths.length > 0) {
                        console.log(`[PathDiscovery] JIT Refresh: ${stalePaths.length} stale paths found for user ${userId}.`);
                        
                        const metadataToFetch = stalePaths.map(p => ({
                            ...p.aiMetadata,
                            targetId: p.target.id
                        }));

                        // Try AI first
                        let aiScores: (number | string)[] = [];
                        let aiFailed = false;
                        try {
                            aiScores = await calculateBatchWarmthScores(metadataToFetch);
                        } catch (err) {
                            console.error('[PathDiscovery] JIT AI Assessment failed, will use deterministic fallback.');
                            aiFailed = true;
                        }

                        const aiScoreMap = new Map<string, number>();
                        metadataToFetch.forEach((m, i) => {
                            if (!aiFailed && typeof aiScores[i] === 'number') {
                                aiScoreMap.set(m.targetId, aiScores[i] as number);
                            }
                        });

                        const targetIds = stalePaths.map(p => p.target.id);
                        const targets = await basePrisma.users.findMany({
                            where: { user_id: { in: targetIds } },
                            include: { interests: true, experiences: true }
                        });
                        const targetMap = new Map(targets.map(t => [t.user_id, t]));

                        const updates = stalePaths.map(p => {
                            let finalScore: number;
                            let isAi = false;
                            let sourceLabel = '';

                            if (aiScoreMap.has(p.target.id)) {
                                finalScore = aiScoreMap.get(p.target.id)!;
                                isAi = true;
                                sourceLabel = 'read from database (AI)';
                            } else {
                                const target = targetMap.get(p.target.id);
                                finalScore = calculateDeterministicWarmScore(requester, target || {}, intentStr);
                                sourceLabel = 'read from database (Deterministic)';
                            }

                            // Update in-memory path object
                            p.strength = finalScore;
                            p.aiMetadata.isAiScored = isAi;
                            p.aiMetadata.scoreSource = isAi ? 'database_specific' : 'database_all'; // approximate

                            console.log(`[PathDiscovery] JIT Update: Warmth score for ${p.target.name}: ${finalScore} (${isAi ? 'AI calculated' : 'deterministic scoring'})`);

                            return basePrisma.warmScores.upsert({
                                where: {
                                    uq_warm_score: {
                                        requester_id: userId,
                                        target_id: p.target.id,
                                        intent: intentStr
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
                                    intent: intentStr,
                                    score: finalScore,
                                    is_ai_scored: isAi
                                }
                            });
                        });

                        await Promise.all(updates);
                        
                        // Re-sort results after updates
                        finalPaths.sort((a, b) => b.strength - a.strength);
                    }
                }
            } catch (err) {
                console.error('[PathDiscovery] JIT Refresh Error:', err);
            }
        } else {
            // Standard logging for non-JIT calls
            finalPaths.forEach(p => {
                let sourceLabel = 'deterministic scoring (fallback)';
                if (p.aiMetadata.scoreSource === 'database_specific' || p.aiMetadata.scoreSource === 'database_all') {
                    sourceLabel = p.aiMetadata.isAiScored ? 'read from database (AI)' : 'read from database (Deterministic)';
                } else if (p.aiMetadata.scoreSource === 'avg_connector') {
                    sourceLabel = 'deterministic scoring (avg connector strength)';
                }
                console.log(`[PathDiscovery] Warmth score for ${p.target.name}: ${p.strength} (${sourceLabel})`);
            });
        }

        return finalPaths;
}
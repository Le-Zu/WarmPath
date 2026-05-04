import { basePrisma } from '../lib/prisma'

// Returns two-hop paths for a user, enriched with connector and target profile details.
// When intentFilter is provided, only paths whose target has a matching interest category
// are returned — this drives the intent filter bar on the Paths page.
export async function getPathsForUser(userId: string, intentFilter?: string) {
  const intentStr = intentFilter || 'all';
  const rows = await basePrisma.$queryRaw<any[]>`
        SELECT
          v.connector_id,
          v.target_id,
          v.requester_connector_context,
          v.connector_target_context,
          COALESCE(
            ws_specific.score, 
            ws_all.score, 
            ROUND(v.avg_connector_score), 
            1
          ) AS strength,
          c.first_name  AS connector_first_name,
          c.last_name   AS connector_last_name,
          c.major       AS connector_major,
          c.year        AS connector_year,
          c.bio         AS connector_bio,
          t.first_name  AS target_first_name,
          t.last_name   AS target_last_name,
          t.major       AS target_major,
          t.year        AS target_year,
          t.bio         AS target_bio,
          t.profile_picture_url AS target_picture_url,
          ps_target.discovery_mode AS target_discovery_mode,
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

        return rows.map((r) => {
        const isAnonymous = r.target_discovery_mode === 'anonymous';

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
        name: isAnonymous 
          ? `${r.target_first_name} ${r.target_last_name ? r.target_last_name[0] + '.' : ''}`
          : [r.target_first_name, r.target_last_name].filter(Boolean).join(' '),
        role: [r.target_major, r.target_year].filter(Boolean).join(', ') || null,
        pictureUrl: isAnonymous ? null : (r.target_picture_url ?? null),
        isAnonymous,
        },
        strength: Number(r.strength),
        // Metadata block designed for easy AI prompting
        aiMetadata: {
        targetId: r.target_id,
        intentFilter: intentFilter ?? 'None',
        requesterToConnector: r.requester_connector_context,
        connectorToTarget: r.connector_target_context,
        targetInterests: r.target_interests ?? '',
        targetBio: r.target_bio ?? '',
        connectorBio: r.connector_bio ?? '',
        },
        };
        });
        }
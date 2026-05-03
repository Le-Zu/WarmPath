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
          COALESCE(ps.score, ROUND(v.avg_warmth)) AS strength,
          c.first_name  AS connector_first_name,
          c.last_name   AS connector_last_name,
          c.bio         AS connector_bio,
          t.first_name  AS target_first_name,
          t.last_name   AS target_last_name,
          t.major       AS target_major,
          t.year        AS target_year,
          t.bio         AS target_bio,
          t.profile_picture_url AS target_picture_url,
          (SELECT STRING_AGG(label, ', ') FROM user_interests WHERE user_id = v.target_id) AS target_interests
        FROM two_hop_paths_view v
        JOIN users c ON c.user_id = v.connector_id
        JOIN users t ON t.user_id = v.target_id
        LEFT JOIN privacy_settings ps_target ON ps_target.user_id = v.target_id
        LEFT JOIN path_scores ps ON ps.requester_id = v.requester_id 
             AND ps.target_id = v.target_id 
             AND ps.intent = ${intentStr}
        WHERE v.requester_id = ${userId}
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

  return rows.map((r) => ({
    id: `${r.connector_id}-${r.target_id}`,
    connector: {
      id: r.connector_id,
      name: [r.connector_first_name, r.connector_last_name].filter(Boolean).join(' '),
      relation: r.requester_connector_context ?? null,
    },
    target: {
      id: r.target_id,
      name: [r.target_first_name, r.target_last_name].filter(Boolean).join(' '),
      role: [r.target_major, r.target_year].filter(Boolean).join(', ') || null,
      pictureUrl: r.target_picture_url ?? null,
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
  }));
}
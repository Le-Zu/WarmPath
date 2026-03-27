CREATE VIEW user_connections_view AS
SELECT c.connection_id, c.context, c.warmth_score, c.accepted_at,
       u1.user_id AS user_id, u2.user_id AS connected_user_id,
       u2.first_name, u2.last_name, u2.major, u2.year, u2.profile_picture_url
FROM connections c
JOIN users u1 ON u1.user_id = c.user_id_a
JOIN users u2 ON u2.user_id = c.user_id_b
WHERE c.status = 'accepted'
UNION ALL
SELECT c.connection_id, c.context, c.warmth_score, c.accepted_at,
       u2.user_id, u1.user_id,
       u1.first_name, u1.last_name, u1.major, u1.year, u1.profile_picture_url
FROM connections c
JOIN users u1 ON u1.user_id = c.user_id_a
JOIN users u2 ON u2.user_id = c.user_id_b
WHERE c.status = 'accepted';

CREATE VIEW two_hop_paths_view AS
SELECT a.user_id          AS requester_id,
       a.connected_user_id AS connector_id,
       b.connected_user_id AS target_id,
       a.context          AS requester_connector_context,
       b.context          AS connector_target_context,
       a.warmth_score     AS requester_connector_warmth,
       b.warmth_score     AS connector_target_warmth,
       (a.warmth_score + b.warmth_score) / 2.0 AS avg_warmth
FROM user_connections_view a
JOIN user_connections_view b ON a.connected_user_id = b.user_id
WHERE a.user_id <> b.connected_user_id
  AND a.user_id NOT IN (
        SELECT connected_user_id FROM user_connections_view
        WHERE user_id = a.user_id);
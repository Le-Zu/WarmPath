CREATE OR REPLACE VIEW user_connections_view AS
SELECT c.connection_id, c.context, c.connector_score, c.accepted_at,
       u1.user_id AS user_id, u2.user_id AS connected_user_id,
       u2.first_name, u2.last_name, u2.major, u2.year
FROM connections c
JOIN users u1 ON u1.user_id = c.user_id_a
JOIN users u2 ON u2.user_id = c.user_id_b
WHERE c.status = 'accepted'
UNION ALL
SELECT c.connection_id, c.context, c.connector_score, c.accepted_at,
       u2.user_id, u1.user_id,
       u1.first_name, u1.last_name, u1.major, u1.year
FROM connections c
JOIN users u1 ON u1.user_id = c.user_id_a
JOIN users u2 ON u2.user_id = c.user_id_b
WHERE c.status = 'accepted';

CREATE OR REPLACE VIEW two_hop_paths_view AS
SELECT a.user_id          AS requester_id,
       a.connected_user_id AS connector_id,
       b.connected_user_id AS target_id,
       a.context          AS requester_connector_context,
       b.context          AS connector_target_context,
       COALESCE(a.connector_score, 3) AS requester_connector_warmth,
       COALESCE(b.connector_score, 3) AS connector_target_warmth,
       (COALESCE(a.connector_score, 3) + COALESCE(b.connector_score, 3)) / 2.0 AS avg_connector_score
FROM user_connections_view a
JOIN user_connections_view b ON a.connected_user_id = b.user_id
WHERE a.user_id <> b.connected_user_id
  AND a.user_id NOT IN (
        SELECT connected_user_id FROM user_connections_view
        WHERE user_id = a.user_id);

-- Connector inbox view
CREATE OR REPLACE VIEW connector_inbox_view AS
SELECT ir.request_id, ir.status, ir.created_at, ir.responded_at,
       ir.connector_note,
       COALESCE(ir.edited_message, ir.draft_message) AS message_to_send,
       req.user_id    AS requester_id,
       req.first_name AS requester_first,
       req.last_name  AS requester_last,
       tgt.user_id    AS target_id,
       tgt.first_name AS target_first,
       tgt.last_name  AS target_last,
       i.category     AS intent_category,
       i.description  AS intent_description,
       ir.connector_id
FROM intro_requests ir
JOIN users req ON req.user_id = ir.requester_id
JOIN users tgt ON tgt.user_id = ir.target_id
JOIN intents i  ON i.intent_id = ir.intent_id;

-- Auto-set responded_at when an intro request status leaves 'pending'
CREATE OR REPLACE FUNCTION set_responded_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status <> 'pending' AND OLD.status = 'pending' THEN
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_intro_request_responded ON intro_requests;
CREATE TRIGGER trg_intro_request_responded
    BEFORE UPDATE ON intro_requests
    FOR EACH ROW EXECUTE FUNCTION set_responded_at();
-- ============================================================
--  NETWORK PLATFORM DATABASE SCHEMA
--  PostgreSQL compatible
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
--  USERS
-- ============================================================
CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    year            VARCHAR(20)  CHECK (year IN ('freshman', 'sophomore', 'junior', 'senior', 'grad', 'other')),
    major           VARCHAR(100),
    bio             TEXT,
    linkedin_url    VARCHAR(500),
    resume_url      VARCHAR(500),
    profile_picture_url VARCHAR(500),
    profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);


-- ============================================================
--  USER INTERESTS  (what a user is interested in / good at)
-- ============================================================
CREATE TYPE intent_category AS ENUM ('class', 'internship', 'research', 'club', 'skill');

CREATE TABLE user_interests (
    interest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category    intent_category NOT NULL,
    label       VARCHAR(200) NOT NULL   -- e.g. "Machine Learning", "Pre-law debate"
);

CREATE INDEX idx_user_interests_user ON user_interests(user_id);


-- ============================================================
--  USER EXPERIENCES
-- ============================================================
CREATE TABLE user_experiences (
    experience_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type           intent_category NOT NULL,
    title          VARCHAR(200) NOT NULL,
    organization   VARCHAR(200),
    start_date     DATE,
    end_date       DATE,                -- NULL = current/ongoing
    description    TEXT
);

CREATE INDEX idx_user_experiences_user ON user_experiences(user_id);


-- ============================================================
--  PRIVACY SETTINGS  (one row per user)
-- ============================================================
CREATE TYPE request_permission AS ENUM ('anyone', 'connections', 'connections_of_connections');

CREATE TABLE privacy_settings (
    privacy_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    who_can_request         request_permission NOT NULL DEFAULT 'connections_of_connections',
    show_in_discovery       BOOLEAN NOT NULL DEFAULT TRUE,
    allow_connector_prompts BOOLEAN NOT NULL DEFAULT TRUE
);


-- ============================================================
--  CONNECTIONS  (bidirectional; enforced by user_id_a < user_id_b)
-- ============================================================
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE connections (
    connection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_a     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_id_b     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    context       TEXT NOT NULL,        -- "CS 499 group", "Dorm roommates freshman year"
    warmth_score  SMALLINT CHECK (warmth_score BETWEEN 1 AND 5),
    status        connection_status NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    accepted_at   TIMESTAMP,

    -- prevent duplicates and self-connections
    CONSTRAINT chk_no_self_connection CHECK (user_id_a <> user_id_b),
    CONSTRAINT chk_ordered_ids        CHECK (user_id_a < user_id_b),
    CONSTRAINT uq_connection_pair     UNIQUE (user_id_a, user_id_b)
);

CREATE INDEX idx_connections_a ON connections(user_id_a);
CREATE INDEX idx_connections_b ON connections(user_id_b);


-- ============================================================
--  INTENTS  (required before browsing; Feature 2)
-- ============================================================
CREATE TABLE intents (
    intent_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category    intent_category NOT NULL,
    description TEXT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP
);

-- Enforce only one active intent per user at a time
CREATE UNIQUE INDEX uq_one_active_intent
    ON intents(user_id)
    WHERE is_active = TRUE;

CREATE INDEX idx_intents_user    ON intents(user_id);
CREATE INDEX idx_intents_active  ON intents(is_active) WHERE is_active = TRUE;


-- ============================================================
--  INTRO REQUESTS  (Features 4 & 5)
-- ============================================================
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'declined', 'withdrawn');

CREATE TABLE intro_requests (
    request_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    connector_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    intent_id       UUID NOT NULL REFERENCES intents(intent_id) ON DELETE CASCADE,
    draft_message   TEXT NOT NULL,      -- AI-generated
    edited_message  TEXT,               -- user's version (NULL = sent as-is)
    status          request_status NOT NULL DEFAULT 'pending',
    connector_note  TEXT,               -- connector's reason for declining / edit note
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMP,

    CONSTRAINT chk_distinct_parties CHECK (
        requester_id <> connector_id AND
        requester_id <> target_id   AND
        connector_id <> target_id
    )
);

CREATE INDEX idx_intro_requests_requester ON intro_requests(requester_id);
CREATE INDEX idx_intro_requests_connector ON intro_requests(connector_id);
CREATE INDEX idx_intro_requests_target    ON intro_requests(target_id);
CREATE INDEX idx_intro_requests_status    ON intro_requests(status);


-- ============================================================
--  CONNECTOR PROMPTS  (Feature 6 – proactive prompts)
-- ============================================================
CREATE TYPE prompt_status AS ENUM ('pending', 'volunteered', 'dismissed');

CREATE TABLE connector_prompts (
    prompt_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intent_id              UUID NOT NULL REFERENCES intents(intent_id) ON DELETE CASCADE,
    connector_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status                 prompt_status NOT NULL DEFAULT 'pending',
    volunteered_target_id  UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    responded_at           TIMESTAMP,

    CONSTRAINT uq_prompt_per_connector UNIQUE (intent_id, connector_id)
);

CREATE INDEX idx_connector_prompts_connector ON connector_prompts(connector_id);
CREATE INDEX idx_connector_prompts_intent    ON connector_prompts(intent_id);


-- ============================================================
--  CONTEXT PRE-READS  (Feature 7 – sent on approval)
-- ============================================================
CREATE TABLE context_prereads (
    preread_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id   UUID NOT NULL REFERENCES intro_requests(request_id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,  -- who reads it
    subject_id   UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,  -- who it's about
    summary      TEXT NOT NULL,         -- AI-generated brief (year, major, experience, interests)
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    viewed_at    TIMESTAMP,

    CONSTRAINT uq_preread UNIQUE (request_id, recipient_id, subject_id)
);

CREATE INDEX idx_prereads_recipient ON context_prereads(recipient_id);
CREATE INDEX idx_prereads_request   ON context_prereads(request_id);


-- ============================================================
--  CONVERSATIONS  (Feature 8 – coffee chat)
-- ============================================================
CREATE TYPE conversation_type   AS ENUM ('chat', 'email');
CREATE TYPE conversation_status AS ENUM ('active', 'connector_left', 'closed');

CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id      UUID NOT NULL UNIQUE REFERENCES intro_requests(request_id) ON DELETE CASCADE,
    type            conversation_type   NOT NULL DEFAULT 'chat',
    status          conversation_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_request ON conversations(request_id);


-- ============================================================
--  CONVERSATION PARTICIPANTS
-- ============================================================
CREATE TYPE participant_role AS ENUM ('requester', 'connector', 'target');

CREATE TABLE conversation_participants (
    participant_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role            participant_role NOT NULL,
    joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    left_at         TIMESTAMP,          -- NULL = still in conversation; connector may leave after intro

    CONSTRAINT uq_participant UNIQUE (conversation_id, user_id)
);

CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user         ON conversation_participants(user_id);


-- ============================================================
--  MESSAGES
-- ============================================================
CREATE TABLE messages (
    message_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    is_warm_intro   BOOLEAN NOT NULL DEFAULT FALSE,  -- flags connector's icebreaker message
    sent_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender       ON messages(sender_id);
CREATE INDEX idx_messages_sent_at      ON messages(conversation_id, sent_at);


-- ============================================================
--  NOTIFICATIONS
-- ============================================================
CREATE TYPE notification_type AS ENUM (
    'intro_request',
    'request_approved',
    'request_declined',
    'new_message',
    'connector_prompt',
    'connection_accepted'
);

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    reference_id    UUID NOT NULL,       -- ID of the related entity
    reference_type  VARCHAR(50) NOT NULL, -- 'intro_requests' | 'messages' | 'connector_prompts' | etc.
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_unread  ON notifications(user_id) WHERE is_read = FALSE;


-- ============================================================
--  HELPER VIEWS
-- ============================================================

-- Active connections for a given user (both directions)
CREATE VIEW user_connections_view AS
SELECT
    c.connection_id,
    c.context,
    c.warmth_score,
    c.accepted_at,
    u1.user_id   AS user_id,
    u2.user_id   AS connected_user_id,
    u2.first_name,
    u2.last_name,
    u2.major,
    u2.year
FROM connections c
JOIN users u1 ON u1.user_id = c.user_id_a
JOIN users u2 ON u2.user_id = c.user_id_b
WHERE c.status = 'accepted'

UNION ALL

SELECT
    c.connection_id,
    c.context,
    c.warmth_score,
    c.accepted_at,
    u2.user_id   AS user_id,
    u1.user_id   AS connected_user_id,
    u1.first_name,
    u1.last_name,
    u1.major,
    u1.year
FROM connections c
JOIN users u1 ON u1.user_id = c.user_id_a
JOIN users u2 ON u2.user_id = c.user_id_b
WHERE c.status = 'accepted';


-- 2-hop paths: You → Connector → Target (for path discovery)
CREATE VIEW two_hop_paths_view AS
SELECT
    a.user_id          AS requester_id,
    a.connected_user_id AS connector_id,
    b.connected_user_id AS target_id,
    a.context          AS requester_connector_context,
    b.context          AS connector_target_context,
    a.warmth_score     AS requester_connector_warmth,
    b.warmth_score     AS connector_target_warmth,
    (a.warmth_score + b.warmth_score) / 2.0 AS avg_warmth
FROM user_connections_view a
JOIN user_connections_view b
    ON a.connected_user_id = b.user_id
WHERE a.user_id <> b.connected_user_id   -- exclude loops back to requester
  AND a.user_id NOT IN (                 -- exclude direct connections (not 2-hop)
        SELECT connected_user_id
        FROM user_connections_view
        WHERE user_id = a.user_id
    );


-- Connector inbox view
CREATE VIEW connector_inbox_view AS
SELECT
    ir.request_id,
    ir.status,
    ir.created_at,
    ir.responded_at,
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


-- ============================================================
--  TRIGGER: auto-update users.updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
--  TRIGGER: create privacy_settings row on new user
-- ============================================================
CREATE OR REPLACE FUNCTION create_default_privacy()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO privacy_settings (user_id) VALUES (NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_new_user_privacy
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_privacy();


-- ============================================================
--  TRIGGER: set responded_at on intro_request status change
-- ============================================================
CREATE OR REPLACE FUNCTION set_responded_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status <> 'pending' AND OLD.status = 'pending' THEN
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_intro_request_responded
    BEFORE UPDATE ON intro_requests
    FOR EACH ROW EXECUTE FUNCTION set_responded_at();


-- ============================================================
--  TRIGGER: deactivate old intent when new one is created
-- ============================================================
CREATE OR REPLACE FUNCTION deactivate_old_intents()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE intents
    SET is_active = FALSE
    WHERE user_id = NEW.user_id
      AND intent_id <> NEW.intent_id
      AND is_active = TRUE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_one_active_intent
    AFTER INSERT ON intents
    FOR EACH ROW EXECUTE FUNCTION deactivate_old_intents();

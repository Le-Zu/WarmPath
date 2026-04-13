-- ==========================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ==========================================

-- Drop all existing policies on public tables so this file is safe to re-run
DO $$
DECLARE r record;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 1. Create a function to get the current user ID from the session
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
    SELECT current_setting('app.current_user_id', true)::UUID;
$$ LANGUAGE sql STABLE;

-- 2. Enable RLS on all tables and force it for the owner (Prisma)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests FORCE ROW LEVEL SECURITY;

ALTER TABLE user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experiences FORCE ROW LEVEL SECURITY;

ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings FORCE ROW LEVEL SECURITY;

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections FORCE ROW LEVEL SECURITY;

ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents FORCE ROW LEVEL SECURITY;

ALTER TABLE intro_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE intro_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE context_prereads ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_prereads FORCE ROW LEVEL SECURITY;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants FORCE ROW LEVEL SECURITY;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

ALTER TABLE connector_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_prompts FORCE ROW LEVEL SECURITY;


-- 3. Define Policies

-- USERS
-- Anyone can see basic profile info (needed for discovery)
CREATE POLICY "Users are visible to everyone" ON users
    FOR SELECT USING (true);
-- Registration creates a user before a session exists, so INSERT is open
CREATE POLICY "Anyone can register" ON users
    FOR INSERT WITH CHECK (true);
-- Users can only update their own profile
CREATE POLICY "Users can only update themselves" ON users
    FOR UPDATE USING (user_id = get_current_user_id());

-- USER INTERESTS
CREATE POLICY "Interests are visible to everyone" ON user_interests
    FOR SELECT USING (true);
CREATE POLICY "Users can manage their own interests" ON user_interests
    FOR ALL USING (user_id = get_current_user_id());

-- USER EXPERIENCES
CREATE POLICY "Experiences are visible to everyone" ON user_experiences
    FOR SELECT USING (true);
CREATE POLICY "Users can manage their own experiences" ON user_experiences
    FOR ALL USING (user_id = get_current_user_id());

-- PRIVACY SETTINGS
-- Row is created at registration time (before session exists), so INSERT is open
CREATE POLICY "Privacy settings can be created on registration" ON privacy_settings
    FOR INSERT WITH CHECK (true);
-- Only the user can read or update their own privacy settings
CREATE POLICY "Users can manage their own privacy settings" ON privacy_settings
    FOR ALL USING (user_id = get_current_user_id());

-- CONNECTIONS
-- A user can see connections where they are either user A or user B
CREATE POLICY "Users can see their own connections" ON connections
    FOR SELECT USING (user_id_a = get_current_user_id() OR user_id_b = get_current_user_id());
-- A user can only create/update connections where they are one of the parties
CREATE POLICY "Users can manage their own connections" ON connections
    FOR ALL USING (user_id_a = get_current_user_id() OR user_id_b = get_current_user_id());

-- INTENTS
-- Anyone can see intents (needed for discovery/prompts)
CREATE POLICY "Intents are visible to everyone" ON intents
    FOR SELECT USING (true);
-- Only the user can manage their own intents
CREATE POLICY "Users can manage their own intents" ON intents
    FOR ALL USING (user_id = get_current_user_id());

-- INTRO REQUESTS
-- A user can see intro requests where they are requester, connector, or target
CREATE POLICY "Users can see relevant intro requests" ON intro_requests
    FOR SELECT USING (
        requester_id = get_current_user_id() OR 
        connector_id = get_current_user_id() OR 
        target_id = get_current_user_id()
    );
-- Only involved parties can manage the request (actual logic should be more restrictive, but this is a base)
CREATE POLICY "Users can manage relevant intro requests" ON intro_requests
    FOR ALL USING (
        requester_id = get_current_user_id() OR 
        connector_id = get_current_user_id() OR 
        target_id = get_current_user_id()
    );

-- CONTEXT PREREADS
-- Only the recipient can see the preread
CREATE POLICY "Recipient can see their prereads" ON context_prereads
    FOR SELECT USING (recipient_id = get_current_user_id());

-- CONVERSATIONS
-- Users can see conversations they are part of
CREATE POLICY "Users can see their conversations" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = conversations.conversation_id 
            AND user_id = get_current_user_id()
        )
    );

-- CONVERSATION PARTICIPANTS
-- Users can see participants of conversations they are part of
CREATE POLICY "Users can see fellow participants" ON conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants internal
            WHERE internal.conversation_id = conversation_participants.conversation_id 
            AND internal.user_id = get_current_user_id()
        )
    );

-- MESSAGES
-- Users can see messages in conversations they are part of
CREATE POLICY "Users can see conversation messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = get_current_user_id()
        )
    );
-- Users can only send messages as themselves
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (sender_id = get_current_user_id());

-- NOTIFICATIONS
-- Only the user can see/manage their own notifications
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (user_id = get_current_user_id());

-- CONNECTOR PROMPTS
-- Only the connector can see/manage their own prompts
CREATE POLICY "Connectors can manage their prompts" ON connector_prompts
    FOR ALL USING (connector_id = get_current_user_id());

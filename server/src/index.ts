import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initSocket } from './services/socket';
import { verifyToken, dbUserMiddleware, AuthRequest } from './middleware/authMiddleware';
import { basePrisma } from './lib/prisma';
import { getPathsForUser } from './services/pathDiscovery';
import { calculateBatchWarmthScores } from './services/gemini';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(httpServer);

// -- Standard Middleware --
// Allows Vite fontend to make requests to this server
app.use(cors());

// Allows Express to read JSON data sent in the request body
app.use(express.json());

// -- Public route
// Anyone can check, for if the server is running
app.get('/api/ping', (req, res) => {
    res.json({ message: 'PONG: WarmPath API is up and running!' });
});

// -- Protected routes
// Use dbUserMiddleware after verifyToken to populate the user's DB ID for RLS
app.use('/api', verifyToken, dbUserMiddleware);

app.get('/api/test-auth', (req: AuthRequest, res) => {

    const userUid = req.user?.uid;
    const userEmail = req.user?.email;
    const dbUserId = req.dbUser?.user_id;

    console.log(`Secure request received from: ${userEmail} (DB ID: ${dbUserId})`);

    res.json({
        message: "Authenticated request successful!",
        userUid,
        userEmail,
        dbUserId
    });
});

// Create or sync user after Firebase registration
app.post('/api/users', async (req: AuthRequest, res) => {
    try {
        const { uid, email } = req.user;

        if (email.endsWith('@dev.warmpath.com') || email.endsWith('@warmpath.com') || email.endsWith('@test.warmpath.com') 
            || email.endsWith('@localhost') || email.endsWith('@warmpath.io') || email.endsWith('@warmpath.org') || email.endsWith('@warmpath.net')
            || email.endsWith('@warmpath.tech')) { // add more email domains here if needed
            console.log("This email domain is not permitted for registration.");
            return res.status(403).json({ error: 'This email domain is not permitted for registration.' });
        }
        const { first_name, last_name } = req.body;

        const user = await basePrisma.users.upsert({
            where: { email },
            update: {
                firebase_uid: uid,
                is_active: true, // Activate ghost profiles
                ...(first_name && { first_name }),
                ...(last_name && { last_name }),
            },
            create: {
                email,
                firebase_uid: uid,
                is_active: true,
                ...(first_name && { first_name }),
                ...(last_name && { last_name }),
            },
        });

        console.log(`[POST /api/users] User synced | user_id: ${user.user_id} | email: ${user.email} | firebase_uid: ${user.firebase_uid}`);

        res.status(201).json({
            message: "User synced successfully",
            user
        });
    } catch (error: any) {
        console.error('[POST /api/users] Error syncing user:', error);
        res.status(500).json({ error: "Failed to sync user with database", details: error.message });
    }
});

// Returns intro requests where the authenticated user is the connector
app.get('/api/requests/incoming', async (req: AuthRequest, res) => {
    if (!req.dbUser) {
        return res.status(404).json({ message: 'User not found in database.' });
    }

    try {
        const rows = await basePrisma.introRequests.findMany({
            where: { connector_id: req.dbUser.user_id },
            include: {
                requester: { select: { first_name: true, last_name: true, major: true, year: true } },
                target:    { select: { first_name: true, last_name: true } },
                intent:    { select: { category: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        const requests = rows.map((r) => ({
            id:      r.request_id,
            status:  r.status,
            message: r.edited_message ?? r.draft_message,
            intent:  r.intent.category,
            from: {
                name: [r.requester.first_name, r.requester.last_name].filter(Boolean).join(' '),
                role: [r.requester.major, r.requester.year].filter(Boolean).join(', ') || null,
            },
            to: {
                name: [r.target.first_name, r.target.last_name].filter(Boolean).join(' '),
            },
        }));

        console.log(`[GET /api/requests/incoming] ${requests.length} requests for user_id: ${req.dbUser.user_id}`);
        res.json({ requests });
    } catch (error: any) {
        console.error('[GET /api/requests/incoming] Error:', error);
        res.status(500).json({ error: 'Failed to fetch incoming requests', details: error.message });
    }
});

// Updates the status of an intro request — connector only
app.patch('/api/requests/:id', async (req: AuthRequest, res) => {
    if (!req.dbUser) {
        return res.status(404).json({ message: 'User not found in database.' });
    }

    const id = req.params.id as string;
    const { status, edited_message, connector_note } = req.body;

    if (!['approved', 'declined'].includes(status)) {
        return res.status(400).json({ error: 'Status must be approved or declined.' });
    }

    try {
        const existing = await basePrisma.introRequests.findUnique({
            where: { request_id: id },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Request not found.' });
        }

        if (existing.connector_id !== req.dbUser.user_id) {
            return res.status(403).json({ error: 'Only the connector can respond to this request.' });
        }

        if (existing.status !== 'pending') {
            return res.status(409).json({ error: 'Request has already been responded to.' });
        }

        const updated = await basePrisma.introRequests.update({
            where: { request_id: id },
            data: { 
                status, 
                responded_at: new Date(),
                ...(edited_message !== undefined && { edited_message }),
                ...(connector_note !== undefined && { connector_note }),
            },
        });

        // If approved, create the conversation
        if (status === 'approved') {
            const conversation = await basePrisma.conversations.create({
                data: {
                    request_id: id,
                    type: 'chat',
                    status: 'active',
                    participants: {
                        create: [
                            { user_id: existing.requester_id, role: 'requester' },
                            { user_id: existing.connector_id, role: 'connector' },
                            { user_id: existing.target_id, role: 'target' },
                        ],
                    },
                },
            });
            console.log(`[PATCH /api/requests/${id}] Conversation created | conversation_id: ${conversation.conversation_id}`);
        }

        // Create notification for the requester
        await basePrisma.notifications.create({
            data: {
                user_id: existing.requester_id,
                type: status === 'approved' ? 'request_approved' : 'request_declined',
                reference_id: id,
                reference_type: 'intro_requests',
            }
        });

        console.log(`[PATCH /api/requests/${id}] Status set to ${status} by user_id: ${req.dbUser.user_id}`);
        res.json({ request: updated });
    } catch (error: any) {
        console.error(`[PATCH /api/requests/${id}] Error:`, error);
        res.status(500).json({ error: 'Failed to update request', details: error.message });
    }
});

// Returns unread (and recent read) notifications for the authenticated user
app.get('/api/notifications', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    try {
        const notifications = await basePrisma.notifications.findMany({
            where: { user_id: req.dbUser.user_id },
            orderBy: { created_at: 'desc' },
            take: 30,
        });
        res.json({ notifications });
    } catch (error: any) {
        console.error('[GET /api/notifications] Error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
    }
});

// Marks a notification as read
app.patch('/api/notifications/:id', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    try {
        const notification = await basePrisma.notifications.findUnique({
            where: { notification_id: req.params.id },
        });

        if (!notification) return res.status(404).json({ error: 'Notification not found.' });
        if (notification.user_id !== req.dbUser.user_id) return res.status(403).json({ error: 'Forbidden.' });

        const updated = await basePrisma.notifications.update({
            where: { notification_id: req.params.id },
            data: { is_read: true },
        });

        res.json({ notification: updated });
    } catch (error: any) {
        console.error('[PATCH /api/notifications/:id] Error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
    }
});

// Creates a new active intent (deactivates the previous one)
app.post('/api/intents', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const VALID_CATEGORIES = ['class','internship','research','club','skill','other','full_time','part_time','volunteer','project'];
    const { category, description, expires_at } = req.body;

    if (!category || !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Valid category is required.' });
    }
    if (!description) {
        return res.status(400).json({ error: 'description is required.' });
    }

    try {
        // Deactivate any existing active intent
        await basePrisma.intents.updateMany({
            where: { user_id: req.dbUser.user_id, is_active: true },
            data: { is_active: false },
        });

        const intent = await basePrisma.intents.create({
            data: {
                user_id: req.dbUser.user_id,
                category,
                description,
                is_active: true,
                ...(expires_at && { expires_at: new Date(expires_at) }),
            },
        });

        console.log(`[POST /api/intents] Intent created | intent_id: ${intent.intent_id} | user_id: ${req.dbUser.user_id}`);
        res.status(201).json({ intent });
    } catch (error: any) {
        console.error('[POST /api/intents] Error:', error);
        res.status(500).json({ error: 'Failed to create intent', details: error.message });
    }
});

// Returns the authenticated user's current active intent
app.get('/api/intents/active', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    try {
        const intent = await basePrisma.intents.findFirst({
            where: { user_id: req.dbUser.user_id, is_active: true },
        });
        res.json({ intent: intent ?? null });
    } catch (error: any) {
        console.error('[GET /api/intents/active] Error:', error);
        res.status(500).json({ error: 'Failed to fetch active intent', details: error.message });
    }
});

// Returns all connections (accepted and pending) for the authenticated user
app.get('/api/connections', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const userId = req.dbUser.user_id;
    try {
        const connections = await basePrisma.connections.findMany({
            where: {
                OR: [{ user_id_a: userId }, { user_id_b: userId }],
                status: { in: ['accepted', 'pending'] },
            },
            include: {
                user_a: { select: { user_id: true, email: true, first_name: true, last_name: true, major: true, year: true, is_active: true } },
                user_b: { select: { user_id: true, email: true, first_name: true, last_name: true, major: true, year: true, is_active: true } },
            },
        });

        // Normalize: always return the other person as "peer"
        const result = connections.map(c => ({
            connection_id: c.connection_id,
            context: c.context,
            warmth_score: c.warmth_score,
            status: c.status,
            peer: c.user_id_a === userId ? c.user_b : c.user_a,
        }));

        res.json({ connections: result });
    } catch (error: any) {
        console.error('[GET /api/connections] Error:', error);
        res.status(500).json({ error: 'Failed to fetch connections', details: error.message });
    }
});

// Sends a connection request to another user
app.post('/api/connections', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    let { peerId, email, context, warmth_score } = req.body;
    if ((!peerId && !email) || !context) {
        return res.status(400).json({ error: 'peerId or email, and context are required.' });
    }

    try {
        // If email is provided, resolve the peerId
        if (!peerId && email) {
            let peer = await basePrisma.users.findUnique({ where: { email } });
            if (!peer) {
                // Create a "Ghost" user (Shadow Profile)
                peer = await basePrisma.users.create({
                    data: {
                        email,
                        is_active: false, // Mark as inactive until they register
                        profile_complete: false,
                    }
                });
                console.log(`[POST /api/connections] Ghost user created for: ${email}`);
            }
            peerId = peer.user_id;
        }

        if (peerId === req.dbUser.user_id) {
            return res.status(400).json({ error: 'You cannot connect with yourself.' });
        }

        // Enforce user_id_a < user_id_b ordering required by the DB constraint
        const userId = req.dbUser.user_id;
        const [user_id_a, user_id_b] = userId < peerId ? [userId, peerId] : [peerId, userId];

        const connection = await basePrisma.connections.create({
            data: { 
                user_id_a, 
                user_id_b, 
                context, 
                warmth_score: warmth_score ?? null, 
                status: 'pending' 
            },
        });

        // Create notification for the peer if they are active
        const peer = await basePrisma.users.findUnique({ where: { user_id: peerId } });
        if (peer?.is_active) {
            await basePrisma.notifications.create({
                data: {
                    user_id: peerId,
                    type: 'connection_accepted', 
                    reference_id: connection.connection_id,
                    reference_type: 'connections',
                }
            });
        }

        res.status(201).json({ connection });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Connection already exists.' });
        }
        console.error('[POST /api/connections] Error:', error);
        res.status(500).json({ error: 'Failed to create connection', details: error.message });
    }
});

// Accepts or declines a pending connection request
app.patch('/api/connections/:id', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ error: 'Status must be accepted or declined.' });
    }

    try {
        const conn = await basePrisma.connections.findUnique({
            where: { connection_id: req.params.id },
        });

        if (!conn) return res.status(404).json({ error: 'Connection not found.' });

        const userId = req.dbUser.user_id;
        if (conn.user_id_a !== userId && conn.user_id_b !== userId) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const updated = await basePrisma.connections.update({
            where: { connection_id: req.params.id },
            data: {
                status,
                ...(status === 'accepted' && { accepted_at: new Date() }),
            },
        });

        // Notify the requester
        const requesterId = conn.user_id_a === userId ? conn.user_id_b : conn.user_id_a;
        if (status === 'accepted') {
             await basePrisma.notifications.create({
                data: {
                    user_id: requesterId,
                    type: 'connection_accepted',
                    reference_id: conn.connection_id,
                    reference_type: 'connections',
                }
            });
        }

        res.json({ connection: updated });
    } catch (error: any) {
        console.error('[PATCH /api/connections/:id] Error:', error);
        res.status(500).json({ error: 'Failed to update connection', details: error.message });
    }
});

// Returns all conversations the authenticated user participates in
app.get('/api/conversations', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    try {
        const participants = await basePrisma.conversationParticipants.findMany({
            where: { user_id: req.dbUser.user_id },
            include: {
                conversation: {
                    include: {
                        participants: {
                            include: {
                                user: { select: { user_id: true, first_name: true, last_name: true } }
                            },
                        },
                    },
                },
            },
        });
        const conversations = participants.map(p => p.conversation);
        res.json({ conversations });
    } catch (error: any) {
        console.error('[GET /api/conversations] Error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
    }
});

// Returns messages in a conversation -- user must be a participant
app.get('/api/conversations/:id/messages', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    try {
        const membership = await basePrisma.conversationParticipants.findFirst({
            where: { conversation_id: req.params.id, user_id: req.dbUser.user_id },
        });

        if (!membership) return res.status(403).json({ error: 'Not a participant in this conversation.' });

        const messages = await basePrisma.messages.findMany({
            where: { conversation_id: req.params.id },
            orderBy: { sent_at: 'asc' },
            include: {
                sender: { select: { first_name: true, last_name: true } }
            },
        });
        res.json({ messages });
    } catch (error: any) {
        console.error('[GET /api/conversations/:id/messages] Error:', error);
        res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }
});

// Sends a message to a conversation
app.post('/api/conversations/:id/messages', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const { body, is_warm_intro } = req.body;
    if (!body) return res.status(400).json({ error: 'body is required.' });

    try {
        const membership = await basePrisma.conversationParticipants.findFirst({
            where: { conversation_id: req.params.id, user_id: req.dbUser.user_id },
        });

        if (!membership) return res.status(403).json({ error: 'Not a participant in this conversation.' });

        const message = await basePrisma.messages.create({
            data: {
                conversation_id: req.params.id,
                sender_id: req.dbUser.user_id,
                body,
                is_warm_intro: is_warm_intro ?? false,
            },
        });
        res.status(201).json({ message });
    } catch (error: any) {
        console.error('[POST /api/conversations/:id/messages] Error:', error);
        res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
});

// Returns intro requests sent by the authenticated user
app.get('/api/requests/outgoing', async (req: AuthRequest, res) => {
    if (!req.dbUser) {
        return res.status(404).json({ message: 'User not found in database.' });
    }

    try {
        const rows = await basePrisma.introRequests.findMany({
            where: { requester_id: req.dbUser.user_id },
            include: {
                connector: { select: { first_name: true, last_name: true } },
                target:    { select: { first_name: true, last_name: true, major: true, year: true } },
                intent:    { select: { category: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        const requests = rows.map((r) => ({
            id:        r.request_id,
            status:    r.status,
            sentAt:    r.created_at,
            intent:    r.intent.category,
            connector: {
                name: [r.connector.first_name, r.connector.last_name].filter(Boolean).join(' '),
            },
            target: {
                name: [r.target.first_name, r.target.last_name].filter(Boolean).join(' '),
                role: [r.target.major, r.target.year].filter(Boolean).join(', ') || null,
            },
        }));

        console.log(`[GET /api/requests/outgoing] ${requests.length} requests for user_id: ${req.dbUser.user_id}`);
        res.json({ requests });
    } catch (error: any) {
        console.error('[GET /api/requests/outgoing] Error:', error);
        res.status(500).json({ error: 'Failed to fetch outgoing requests', details: error.message });
    }
});

// Creates a new intro request from the authenticated user
app.post('/api/requests', async (req: AuthRequest, res) => {
    if (!req.dbUser) {
        return res.status(404).json({ message: 'User not found in database.' });
    }

    const { connectorId, targetId, message } = req.body;

    if (!connectorId || !targetId || !message) {
        return res.status(400).json({ error: 'connectorId, targetId, and message are required.' });
    }

    try {
        const intent = await basePrisma.intents.findFirst({
            where: { user_id: req.dbUser.user_id, is_active: true },
        });

        if (!intent) {
            return res.status(400).json({ error: 'No active intent. Declare your intent first.' });
        }

        const request = await basePrisma.introRequests.create({
            data: {
                requester_id: req.dbUser.user_id,
                connector_id: connectorId,
                target_id: targetId,
                intent_id: intent.intent_id,
                draft_message: message,
                status: 'pending',
            },
        });

        // Create notification for the connector
        await basePrisma.notifications.create({
            data: {
                user_id: connectorId,
                type: 'intro_request',
                reference_id: request.request_id,
                reference_type: 'intro_requests',
            },
        });

        console.log(`[POST /api/requests] Request created | request_id: ${request.request_id} | requester: ${req.dbUser.user_id}`);
        res.status(201).json({ request });
    } catch (error: any) {
        console.error('[POST /api/requests] Error:', error);
        res.status(500).json({ error: 'Failed to create request', details: error.message });
    }
});

// Returns all active users — dev/staging only, used by the UserSwitcher
app.get('/api/dev/users', async (req: AuthRequest, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production.' });
    }

    try {
        const users = await basePrisma.users.findMany({
            where: { is_active: true },
            select: {
                user_id: true,
                email: true,
                first_name: true,
                last_name: true,
                major: true,
                year: true,
            },
            orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
        });

        res.json({ users });
    } catch (error: any) {
        console.error('[GET /api/dev/users] Error:', error);
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});

// Returns discovered warm paths for the authenticated user, optionally filtered by intent category
app.get('/api/paths', async (req: AuthRequest, res) => {
    if (!req.dbUser) {
        return res.status(404).json({ message: 'User not found in database.' });
    }

    const VALID_INTENTS = ['class','internship','research','club','skill','other','full_time','part_time','volunteer','project'];
    const intentParam = typeof req.query.intent === 'string' ? req.query.intent : undefined;
    const intent = intentParam && VALID_INTENTS.includes(intentParam) ? intentParam : undefined;

    try {
        const paths = await getPathsForUser(req.dbUser.user_id, intent);
        console.log(`[GET /api/paths] ${paths.length} paths found for user_id: ${req.dbUser.user_id}${intent ? ` (intent: ${intent})` : ''}`);
        res.json({ paths });
    } catch (error: any) {
        console.error('[GET /api/paths] Error fetching paths:', error);
        res.status(500).json({ error: 'Failed to fetch paths', details: error.message });
    }
});

// AI path assessment endpoint
app.post('/api/paths/assess', async (req: AuthRequest, res) => {
    const { pathsMetadata } = req.body;
    if (!pathsMetadata || !Array.isArray(pathsMetadata)) {
        return res.status(400).json({ error: 'pathsMetadata array is required' });
    }

    try {
        const scores = await calculateBatchWarmthScores(pathsMetadata);
        res.json({ scores });
    } catch (error: any) {
        console.error('[POST /api/paths/assess] Error:', error);
        res.status(500).json({ error: 'Failed to assess paths', details: error.message });
    }
});

// Get the current authenticated user's full profile from DB
app.get('/api/me', (req: AuthRequest, res) => {
    if (!req.dbUser) {
        console.log(`[GET /api/me] No DB record for Firebase user: ${req.user?.email}`);
        return res.status(404).json({ message: 'User not found in database. Call POST /api/users to register.' });
    }

    console.log(`[GET /api/me] Profile fetched | user_id: ${req.dbUser.user_id} | email: ${req.dbUser.email} | firebase_uid: ${req.dbUser.firebase_uid} | profile_complete: ${req.dbUser.profile_complete}`);

    res.json({ user: req.dbUser });
});

// Batch updates interests for the authenticated user
app.post('/api/me/interests', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const { interests } = req.body; // Expecting array of { category, label }
    if (!interests || !Array.isArray(interests)) {
        return res.status(400).json({ error: 'interests array is required.' });
    }

    try {
        await basePrisma.$transaction([
            basePrisma.userInterests.deleteMany({ where: { user_id: req.dbUser.user_id } }),
            basePrisma.userInterests.createMany({
                data: interests.map((i: any) => ({
                    user_id: req.dbUser.user_id,
                    category: i.category,
                    label: i.label,
                })),
            }),
        ]);
        res.status(201).json({ message: 'Interests updated successfully' });
    } catch (error: any) {
        console.error('[POST /api/me/interests] Error:', error);
        res.status(500).json({ error: 'Failed to update interests', details: error.message });
    }
});

// Batch updates experiences for the authenticated user
app.post('/api/me/experiences', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const { experiences } = req.body; // Expecting array of { type, title, organization, description, start_date, end_date }
    if (!experiences || !Array.isArray(experiences)) {
        return res.status(400).json({ error: 'experiences array is required.' });
    }

    try {
        await basePrisma.$transaction([
            basePrisma.userExperiences.deleteMany({ where: { user_id: req.dbUser.user_id } }),
            basePrisma.userExperiences.createMany({
                data: experiences.map((e: any) => ({
                    user_id: req.dbUser.user_id,
                    type: e.type,
                    title: e.title,
                    organization: e.organization || null,
                    description: e.description || null,
                    start_date: e.start_date ? new Date(e.start_date) : null,
                    end_date: e.end_date ? new Date(e.end_date) : null,
                })),
            }),
        ]);
        res.status(201).json({ message: 'Experiences updated successfully' });
    } catch (error: any) {
        console.error('[POST /api/me/experiences] Error:', error);
        res.status(500).json({ error: 'Failed to update experiences', details: error.message });
    }
});

// Updates profile fields for the authenticated user
app.patch('/api/me', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const ALLOWED = ['first_name', 'last_name', 'bio', 'major', 'year', 'linkedin_url', 'profile_picture_url', 'profile_complete'];
    const updates: Record<string, any> = {};

    for (const field of ALLOWED) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
        return res.json({ user: req.dbUser });
    }

    try {
        const user = await basePrisma.users.update({
            where: { user_id: req.dbUser.user_id },
            data: updates,
        });
        console.log(`[PATCH /api/me] Profile updated for user_id: ${req.dbUser.user_id}`);
        res.json({ user });
    } catch (error: any) {
        console.error('[PATCH /api/me] Error:', error);
        res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
});

    // Starts the server
const startServer = (port: number) => {
    const server = httpServer.listen(port);
    
    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`[Server] Port ${port} is occupied, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('[Server] Fatal error:', err);
        }
    });

    server.on('listening', () => {
        console.log(`
┌──────────────────────────────────────────────────┐
│                                                  │
│   🚀 WarmPath API is running!                    │
│   📡 Port: ${port}                                  │
│   🔗 Ping: http://localhost:${port}/api/ping        │
│                                                  │
└──────────────────────────────────────────────────┘
`);
    });
};

startServer(Number(PORT));


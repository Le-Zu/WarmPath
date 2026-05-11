import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initSocket } from './services/socket';
import { verifyToken, dbUserMiddleware, AuthRequest } from './middleware/authMiddleware';
import { basePrisma } from './lib/prisma';
import { getPathsForUser } from './services/pathDiscovery';
import { calculateBatchWarmthScores, generateContextPreread } from './services/gemini';
import { refreshWarmthScoresForUser } from './services/warmthScorer';
import { checkRateLimit, describeRetryAfter } from './lib/rateLimiter';

const HOUR_MS = 60 * 60 * 1000;
const DECLINE_COOLDOWN_MS = 7 * 24 * HOUR_MS;

// Returns the set of user ids that are either blocked by `userId` or have
// blocked `userId`. Used to filter every surface where the two users could
// otherwise encounter each other.
async function getBlockedUserIds(userId: string): Promise<Set<string>> {
    const rows = await basePrisma.userBlocks.findMany({
        where: { OR: [{ blocker_id: userId }, { blocked_id: userId }] },
        select: { blocker_id: true, blocked_id: true },
    });
    const ids = new Set<string>();
    for (const r of rows) {
        if (r.blocker_id !== userId) ids.add(r.blocker_id);
        if (r.blocked_id !== userId) ids.add(r.blocked_id);
    }
    return ids;
}

// Cheap existence check between two specific users.
async function isBlockedBetween(a: string, b: string): Promise<boolean> {
    const found = await basePrisma.userBlocks.findFirst({
        where: {
            OR: [
                { blocker_id: a, blocked_id: b },
                { blocker_id: b, blocked_id: a },
            ],
        },
        select: { block_id: true },
    });
    return !!found;
}
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

// Helper function to delete a user and all their data
async function deleteUserAccount(userId: string, firebaseUid: string | null) {
    // Run everything in a transaction to ensure atomic deletion
    await basePrisma.$transaction(async (tx) => {
        // 1. Delete notifications
        await tx.notifications.deleteMany({ where: { user_id: userId } });

        // 2. Delete warmth scores
        await tx.warmScores.deleteMany({ 
            where: { OR: [{ requester_id: userId }, { target_id: userId }] } 
        });

        // 3. Handle Conversations & Messages
        const participations = await tx.conversationParticipants.findMany({
            where: { user_id: userId },
            select: { conversation_id: true }
        });
        const conversationIds = participations.map(p => p.conversation_id);

        await tx.messages.deleteMany({
            where: { conversation_id: { in: conversationIds } }
        });
        await tx.conversationParticipants.deleteMany({
            where: { conversation_id: { in: conversationIds } }
        });
        await tx.conversations.deleteMany({
            where: { conversation_id: { in: conversationIds } }
        });

        // 4. Delete Context Prereads
        await tx.contextPrereads.deleteMany({
            where: { OR: [{ recipient_id: userId }, { subject_id: userId }] }
        });

        // 5. Delete Connector Prompts
        await tx.connectorPrompts.deleteMany({
            where: { OR: [{ connector_id: userId }, { volunteered_target_id: userId }] }
        });

        // 6. Delete Intro Requests
        await tx.introRequests.deleteMany({
            where: { OR: [
                { requester_id: userId },
                { connector_id: userId },
                { target_id: userId }
            ]}
        });

        // 7. Delete Connections
        await tx.connections.deleteMany({
            where: { OR: [{ user_id_a: userId }, { user_id_b: userId }] }
        });

        // 8. Delete Intents
        await tx.intents.deleteMany({ where: { user_id: userId } });

        // 9. Delete Profile Data
        await tx.userInterests.deleteMany({ where: { user_id: userId } });
        await tx.userExperiences.deleteMany({ where: { user_id: userId } });
        
        try {
            await tx.privacySettings.delete({ where: { user_id: userId } });
        } catch (e) {
            // Might not exist yet
        }

        // 10. Delete the User record
        await tx.users.delete({ where: { user_id: userId } });
    });

    // 11. Delete from Firebase if applicable
    if (firebaseUid && !firebaseUid.startsWith('dev-')) {
        const { adminAuth } = await import('./config/firebase');
        try {
            await adminAuth.deleteUser(firebaseUid);
            console.log(`[deleteUserAccount] Firebase user deleted: ${firebaseUid}`);
        } catch (fbError: any) {
            // If user doesn't exist in Firebase anymore, that's okay
            if (fbError.code !== 'auth/user-not-found') {
                console.error('[deleteUserAccount] Firebase deletion error:', fbError);
            }
        }
    }
}

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

        if (process.env.NODE_ENV === 'production' && (
            email.endsWith('@dev.warmpath.com') || email.endsWith('@warmpath.com') || email.endsWith('@test.warmpath.com') 
            || email.endsWith('@localhost') || email.endsWith('@warmpath.io') || email.endsWith('@warmpath.org') || email.endsWith('@warmpath.net')
            || email.endsWith('@warmpath.tech')
        )) { 
            console.log("This email domain is not permitted for registration in production.");
            return res.status(403).json({ error: 'This email domain is not permitted for registration in production.' });
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
                first_name: first_name || "",
                last_name: last_name || "",
                password_hash: null, // Explicitly null for Firebase users
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
            draft_message:  r.draft_message,
            edited_message: r.edited_message,
            message_to_connector: r.message_to_connector,
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

        // If approved, create the conversation and context pre-reads
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

            // F7: Generate Context Pre-Reads
            try {
                // 1. Fetch full profiles for requester and target
                const [requester, target, intent] = await Promise.all([
                    basePrisma.users.findUnique({ 
                        where: { user_id: existing.requester_id },
                        include: { experiences: true, interests: true }
                    }),
                    basePrisma.users.findUnique({ 
                        where: { user_id: existing.target_id },
                        include: { experiences: true, interests: true }
                    }),
                    basePrisma.intents.findUnique({ where: { intent_id: existing.intent_id } })
                ]);

                if (requester && target) {
                    const intentStr = intent?.category || "general networking";
                    
                    // 2. Generate summaries in parallel
                    const [summaryForRequester, summaryForTarget] = await Promise.all([
                        generateContextPreread(target, `The requester is interested in: ${intentStr}`),
                        generateContextPreread(requester, `The requester reached out about: ${intentStr}`)
                    ]);

                    // 3. Store in database
                    await basePrisma.contextPrereads.createMany({
                        data: [
                            {
                                request_id: id,
                                recipient_id: existing.requester_id,
                                subject_id: existing.target_id,
                                summary: summaryForRequester
                            },
                            {
                                request_id: id,
                                recipient_id: existing.target_id,
                                subject_id: existing.requester_id,
                                summary: summaryForTarget
                            }
                        ]
                    });
                    console.log(`[PATCH /api/requests/${id}] Context pre-reads generated and stored.`);
                }
            } catch (prereadErr) {
                console.error(`[PATCH /api/requests/${id}] Failed to generate pre-reads:`, prereadErr);
                // We don't fail the whole request if pre-reads fail
            }
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

    const id = req.params.id as string;
    try {
        const notification = await basePrisma.notifications.findUnique({
            where: { notification_id: id },
        });

        if (!notification) return res.status(404).json({ error: 'Notification not found.' });
        if (notification.user_id !== req.dbUser.user_id) return res.status(403).json({ error: 'Forbidden.' });

        const updated = await basePrisma.notifications.update({
            where: { notification_id: id },
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
                user_a: { select: { user_id: true, email: true, first_name: true, last_name: true, major: true, year: true, linkedin_url: true, handshake_url: true, is_active: true, intent_status: true, intent_status_expires_at: true } },
                user_b: { select: { user_id: true, email: true, first_name: true, last_name: true, major: true, year: true, linkedin_url: true, handshake_url: true, is_active: true, intent_status: true, intent_status_expires_at: true } },
            },
        });

        // Normalize: always return the other person as "peer"; hide expired statuses.
        const result = connections.map(c => ({
            connection_id: c.connection_id,
            initiator_id: c.initiator_id,
            context: c.context,
            connector_score: c.connector_score,
            status: c.status,
            peer: withFreshStatus(c.user_id_a === userId ? c.user_b : c.user_a),
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

    const limit = checkRateLimit(req.dbUser.user_id, 'add-connector', 10, HOUR_MS);
    if (!limit.ok) {
        return res.status(429).json({
            error: `You've added a lot of connectors recently — try again ${describeRetryAfter(limit.retryAfterMs ?? 0)}.`,
            retry_after_ms: limit.retryAfterMs,
        });
    }

    let { peerId, email, context, connector_score, first_name, last_name } = req.body;
    if ((!peerId && !email) || !context) {
        return res.status(400).json({ error: 'peerId or email, and context are required.' });
    }

    let wasCreated = false;
    try {
        // If email is provided, resolve the peerId
        if (!peerId && email) {
            let peer = await basePrisma.users.findUnique({ where: { email } });
            if (!peer) {
                // Create a "Ghost" user (Shadow Profile) — store any name the inviter provided
                // so the connector list shows a real label instead of falling back to email.
                peer = await basePrisma.users.create({
                    data: {
                        email,
                        first_name: first_name || null,
                        last_name: last_name || null,
                        is_active: false, // Mark as inactive until they register
                        profile_complete: false,
                    }
                });
                wasCreated = true;
                console.log(`[POST /api/connections] Ghost user created for: ${email}`);
            }
            peerId = peer.user_id;
        }

        if (peerId === req.dbUser.user_id) {
            return res.status(400).json({ error: 'You cannot connect with yourself.' });
        }

        if (await isBlockedBetween(req.dbUser.user_id, peerId)) {
            return res.status(403).json({ error: 'This connection cannot be created.' });
        }

        // Enforce user_id_a < user_id_b ordering required by the DB constraint
        const userId = req.dbUser.user_id;
        const [user_id_a, user_id_b] = userId < peerId ? [userId, peerId] : [peerId, userId];

        const connection = await basePrisma.connections.create({
            data: { 
                user_id_a, 
                user_id_b, 
                initiator_id: userId,
                context, 
                connector_score: connector_score ?? null, 
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

        // F3: Refresh warmth scores in the background
        refreshWarmthScoresForUser(userId);
        refreshWarmthScoresForUser(peerId);

        // Hand back the peer so the frontend can offer an invite link when we
        // just created a ghost (was_created), and so it can show a name/email
        // in the success UI without a second round-trip.
        const peerForResponse = await basePrisma.users.findUnique({
            where: { user_id: peerId },
            select: {
                user_id: true,
                email: true,
                first_name: true,
                last_name: true,
                is_active: true,
                intent_status: true,
                intent_status_expires_at: true,
            },
        });

        res.status(201).json({ connection, peer: peerForResponse ? withFreshStatus(peerForResponse) : null, was_created: wasCreated });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'You are already connected with this person.' });
        }
        console.error('[POST /api/connections] Error:', error);
        res.status(500).json({ error: 'Failed to create connection', details: error.message });
    }
});

// Accepts or declines a pending connection request
app.patch('/api/connections/:id', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const id = req.params.id as string;
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ error: 'Status must be accepted or declined.' });
    }

    try {
        const conn = await basePrisma.connections.findUnique({
            where: { connection_id: id },
        });

        if (!conn) return res.status(404).json({ error: 'Connection not found.' });

        const userId = req.dbUser.user_id;
        if (conn.user_id_a !== userId && conn.user_id_b !== userId) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const updated = await basePrisma.connections.update({
            where: { connection_id: id },
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
        const blocked = await getBlockedUserIds(req.dbUser.user_id);
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
                        intro_request: {
                            select: {
                                requester_id: true,
                                target_id: true,
                                intent: { select: { category: true } }
                            }
                        }
                    },
                },
            },
        });
        
        // Drop conversations where any other participant is blocked in either direction.
        const visible = participants.filter((p) =>
            p.conversation.participants.every(
                (cp) => cp.user_id === req.dbUser!.user_id || !blocked.has(cp.user_id),
            ),
        );

        const conversations = await Promise.all(visible.map(async (p) => {
            const conv = p.conversation;
            const ir = conv.intro_request;
            
            // Fetch the warmth score for this path
            const warmScore = await basePrisma.warmScores.findUnique({
                where: {
                    uq_warm_score: {
                        requester_id: ir.requester_id,
                        target_id: ir.target_id,
                        intent: ir.intent.category
                    }
                }
            });

            return {
                ...conv,
                warm_score: warmScore?.score || null
            };
        }));

        res.json({ conversations });
    } catch (error: any) {
        console.error('[GET /api/conversations] Error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
    }
});

// Returns details for a specific conversation
app.get('/api/conversations/:id', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const id = req.params.id as string;
    try {
        const membership = await basePrisma.conversationParticipants.findFirst({
            where: { conversation_id: id, user_id: req.dbUser.user_id },
        });

        if (!membership) return res.status(403).json({ error: 'Not a participant in this conversation.' });

        const conversation = await basePrisma.conversations.findUnique({
            where: { conversation_id: id },
            include: {
                participants: {
                    include: {
                        user: { select: { user_id: true, first_name: true, last_name: true } }
                    }
                },
                intro_request: {
                    select: {
                        requester_id: true,
                        target_id: true,
                        intent: { select: { category: true } }
                    }
                }
            }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

        const ir = conversation.intro_request;
        const warmScore = await basePrisma.warmScores.findUnique({
            where: {
                uq_warm_score: {
                    requester_id: ir.requester_id,
                    target_id: ir.target_id,
                    intent: ir.intent.category
                }
            }
        });

        res.json({ 
            conversation: {
                ...conversation,
                warm_score: warmScore?.score || null
            } 
        });
    } catch (error: any) {
        console.error('[GET /api/conversations/:id] Error:', error);
        res.status(500).json({ error: 'Failed to fetch conversation details', details: error.message });
    }
});

// Returns messages in a conversation -- user must be a participant
app.get('/api/conversations/:id/messages', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const id = req.params.id as string;
    try {
        const membership = await basePrisma.conversationParticipants.findFirst({
            where: { conversation_id: id, user_id: req.dbUser.user_id },
        });

        if (!membership) return res.status(403).json({ error: 'Not a participant in this conversation.' });

        const messages = await basePrisma.messages.findMany({
            where: { conversation_id: id },
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

    const id = req.params.id as string;
    const { body, is_warm_intro } = req.body;
    if (!body) return res.status(400).json({ error: 'body is required.' });

    try {
        const membership = await basePrisma.conversationParticipants.findFirst({
            where: { conversation_id: id, user_id: req.dbUser.user_id },
        });

        if (!membership) return res.status(403).json({ error: 'Not a participant in this conversation.' });

        const message = await basePrisma.messages.create({
            data: {
                conversation_id: id,
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

// Returns the context pre-read for the authenticated user in a conversation
app.get('/api/conversations/:id/preread', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const id = req.params.id as string;
    try {
        const conversation = await basePrisma.conversations.findUnique({
            where: { conversation_id: id },
            select: { request_id: true }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

        const preread = await basePrisma.contextPrereads.findFirst({
            where: { 
                request_id: conversation.request_id,
                recipient_id: req.dbUser.user_id 
            },
            include: {
                subject: { select: { first_name: true, last_name: true } }
            }
        });

        if (!preread) return res.json({ preread: null });

        res.json({ preread });
    } catch (error: any) {
        console.error('[GET /api/conversations/:id/preread] Error:', error);
        res.status(500).json({ error: 'Failed to fetch pre-read', details: error.message });
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
            draft_message:  r.draft_message,
            edited_message: r.edited_message,
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

    const limit = checkRateLimit(req.dbUser.user_id, 'send-intro', 5, HOUR_MS);
    if (!limit.ok) {
        return res.status(429).json({
            error: `You've sent a lot of intro requests in the last hour — try again ${describeRetryAfter(limit.retryAfterMs ?? 0)}.`,
            retry_after_ms: limit.retryAfterMs,
        });
    }

    const { connectorId, targetId, message, messageToConnector } = req.body;

    if (!connectorId || !targetId || !message) {
        return res.status(400).json({ error: 'connectorId, targetId, and message are required.' });
    }

    if (
        await isBlockedBetween(req.dbUser.user_id, targetId) ||
        await isBlockedBetween(req.dbUser.user_id, connectorId)
    ) {
        return res.status(403).json({ error: 'This intro request cannot be sent.' });
    }

    try {
        // Block re-requests to the same target while one is pending or within the
        // post-decline cooldown. Approved requests are intentionally not blocked —
        // a user may want a second intro later (e.g., new role, new event).
        const cooldownStart = new Date(Date.now() - DECLINE_COOLDOWN_MS);
        const recentRequest = await basePrisma.introRequests.findFirst({
            where: {
                requester_id: req.dbUser.user_id,
                target_id: targetId,
                OR: [
                    { status: 'pending' },
                    { status: 'declined', created_at: { gte: cooldownStart } },
                ],
            },
            orderBy: { created_at: 'desc' },
        });
        if (recentRequest) {
            return res.status(409).json({
                error: recentRequest.status === 'pending'
                    ? 'You already have a pending intro request to this person.'
                    : 'A previous intro request to this person was declined recently — you can try again 7 days after the decline.',
                previous_status: recentRequest.status,
            });
        }

        const intent = await basePrisma.intents.findFirst({
            where: { user_id: req.dbUser.user_id, is_active: true },
        });

        if (!intent) {
            return res.status(400).json({ error: 'No active intent. Declare your intent first.' });
        }

        // Check target's privacy settings
        const targetPrivacy = await basePrisma.privacySettings.findUnique({
            where: { user_id: targetId },
        });

        const whoCanRequest = targetPrivacy?.who_can_request || 'connections_of_connections';

        if (whoCanRequest === 'nobody') {
            return res.status(403).json({ error: 'This user is not accepting intro requests.' });
        }

        if (whoCanRequest === 'connections') {
            const isConnected = await basePrisma.connections.findFirst({
                where: {
                    OR: [
                        { user_id_a: req.dbUser.user_id, user_id_b: targetId },
                        { user_id_a: targetId, user_id_b: req.dbUser.user_id },
                    ],
                    status: 'accepted',
                },
            });
            if (!isConnected) {
                return res.status(403).json({ error: 'This user only accepts requests from direct connections.' });
            }
        }

        const request = await basePrisma.introRequests.create({
            data: {
                requester_id: req.dbUser.user_id,
                connector_id: connectorId,
                target_id: targetId,
                intent_id: intent.intent_id,
                draft_message: message,
                message_to_connector: messageToConnector,
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
                firebase_uid: true,
                is_active: true,
                privacy_settings: {
                    select: {
                        discovery_mode: true
                    }
                }
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
        const paths = await getPathsForUser(req.dbUser.user_id, intent, true);
        console.log(`[GET /api/paths] ${paths.length} paths found for user_id: ${req.dbUser.user_id}${intent ? ` (intent: ${intent})` : ''}`);
        res.json({ paths });
    } catch (error: any) {
        console.error('[GET /api/paths] Error fetching paths:', error);
        res.status(500).json({ error: 'Failed to fetch paths', details: error.message });
    }
});

// AI path assessment endpoint
app.post('/api/paths/assess', async (req: AuthRequest, res) => {
    const { pathsMetadata, requesterId, intent } = req.body;
    if (!pathsMetadata || !Array.isArray(pathsMetadata)) {
        return res.status(400).json({ error: 'pathsMetadata array is required' });
    }

    try {
        const scores = await calculateBatchWarmthScores(pathsMetadata);
        
        // Save to DB if metadata includes targetId
        if (requesterId && intent) {
            const intentStr = intent || 'all';
            const updates = pathsMetadata.map((m, i) => {
                if (!m.targetId) return null;
                console.log(`[API] AI assessed score for path to ${m.targetId}: ${scores[i]} (AI calculated)`);
                return basePrisma.warmScores.upsert({
                    where: {
                        uq_warm_score: {
                            requester_id: requesterId,
                            target_id: m.targetId,
                            intent: intentStr
                        }
                    },
                    update: {
                        score: typeof scores[i] === 'number' ? scores[i] : 1,
                        is_ai_scored: typeof scores[i] === 'number',
                        updated_at: new Date()
                    },
                    create: {
                        requester_id: requesterId,
                        target_id: m.targetId,
                        intent: intentStr,
                        score: typeof scores[i] === 'number' ? scores[i] : 1,
                        is_ai_scored: typeof scores[i] === 'number'
                    }
                });
            }).filter(Boolean);

            if (updates.length > 0) {
                await Promise.all(updates);
            }
        }

        res.json({ scores });
    } catch (error: any) {
        console.error('[POST /api/paths/assess] Error:', error);
        res.status(500).json({ error: 'Failed to assess paths', details: error.message });
    }
});

// Get the current authenticated user's full profile from DB
// Hide intent_status if its expiry has passed. The DB row stays as-is so
// users can re-enable a status by clearing the expiry; reads just don't
// surface stale text.
function withFreshStatus<T extends { intent_status?: string | null; intent_status_expires_at?: Date | null }>(user: T): T {
    if (!user) return user;
    const expiresAt = user.intent_status_expires_at;
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
        return { ...user, intent_status: null, intent_status_expires_at: null };
    }
    return user;
}

app.get('/api/me', (req: AuthRequest, res) => {
    if (!req.dbUser) {
        console.log(`[GET /api/me] No DB record for Firebase user: ${req.user?.email}`);
        return res.status(404).json({ message: 'User not found in database. Call POST /api/users to register.' });
    }

    console.log(`[GET /api/me] Profile fetched | user_id: ${req.dbUser.user_id} | email: ${req.dbUser.email} | firebase_uid: ${req.dbUser.firebase_uid} | profile_complete: ${req.dbUser.profile_complete}`);

    res.json({ user: withFreshStatus(req.dbUser) });
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

        // F3: Refresh warmth scores in the background
        refreshWarmthScoresForUser(req.dbUser.user_id);

        res.status(200).json({ message: 'Interests updated successfully.' });
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

        // F3: Refresh warmth scores in the background
        refreshWarmthScoresForUser(req.dbUser.user_id);

        res.status(200).json({ message: 'Experiences updated successfully.' });
    } catch (error: any) {
        console.error('[POST /api/me/experiences] Error:', error);
        res.status(500).json({ error: 'Failed to update experiences', details: error.message });
    }
});

// Updates profile fields for the authenticated user
app.patch('/api/me', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const ALLOWED = ['first_name', 'last_name', 'bio', 'major', 'year', 'linkedin_url', 'handshake_url', 'profile_picture_url', 'banner_picture_url', 'profile_complete', 'intent_status', 'intent_status_expires_at'];
    const updates: Record<string, any> = {};

    for (const field of ALLOWED) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    // Coerce expiry from ISO string to Date (or null) so Prisma accepts it.
    if (updates.intent_status_expires_at !== undefined) {
        updates.intent_status_expires_at = updates.intent_status_expires_at ? new Date(updates.intent_status_expires_at) : null;
    }
    // Empty string clears the status.
    if (updates.intent_status !== undefined && updates.intent_status === '') {
        updates.intent_status = null;
        updates.intent_status_expires_at = null;
    }

    if (Object.keys(updates).length === 0) {
        return res.json({ user: req.dbUser });
    }

    try {
        const user = await basePrisma.users.update({
            where: { user_id: req.dbUser.user_id },
            data: updates,
        });
        
        // F3: Refresh warmth scores in the background
        refreshWarmthScoresForUser(req.dbUser.user_id);

        console.log(`[PATCH /api/me] Profile updated for user_id: ${req.dbUser.user_id}`);
        res.json({ user });
    } catch (error: any) {
        console.error('[PATCH /api/me] Error:', error);
        res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
});

app.patch('/api/me/privacy', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const ALLOWED = ['who_can_request', 'show_in_discovery', 'allow_connector_prompts', 'discovery_mode'];
    const updates: Record<string, any> = {};

    for (const field of ALLOWED) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
        return res.json({ privacy_settings: req.dbUser.privacy_settings });
    }

    try {
        const privacySettings = await basePrisma.privacySettings.upsert({
            where: { user_id: req.dbUser.user_id },
            update: updates,
            create: {
                user_id: req.dbUser.user_id,
                ...updates,
            },
        });

        console.log(`[PATCH /api/me/privacy] Privacy settings updated for user_id: ${req.dbUser.user_id}`);
        res.json({ privacy_settings: privacySettings });
    } catch (error: any) {
        console.error('[PATCH /api/me/privacy] Error:', error);
        res.status(500).json({ error: 'Failed to update privacy settings', details: error.message });
    }
});

// ────────────────────────────────────────────────────────────
// Moderation: reports + blocks
// ────────────────────────────────────────────────────────────

// Creates a report against another user. Optionally tied to a specific message.
app.post('/api/reports', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const { reported_id, message_id, reason, notes } = req.body;
    const VALID_REASONS = ['harassment', 'spam', 'impersonation', 'other'];

    if (!reported_id || !reason) {
        return res.status(400).json({ error: 'reported_id and reason are required.' });
    }
    if (!VALID_REASONS.includes(reason)) {
        return res.status(400).json({ error: 'Invalid reason.' });
    }
    if (reported_id === req.dbUser.user_id) {
        return res.status(400).json({ error: 'You cannot report yourself.' });
    }

    try {
        const report = await basePrisma.reports.create({
            data: {
                reporter_id: req.dbUser.user_id,
                reported_id,
                message_id: message_id || null,
                reason,
                notes: notes || null,
            },
        });
        console.log(`[POST /api/reports] Report filed | report_id: ${report.report_id} | reporter: ${req.dbUser.user_id} | reported: ${reported_id} | reason: ${reason}`);
        res.status(201).json({ report });
    } catch (error: any) {
        console.error('[POST /api/reports] Error:', error);
        res.status(500).json({ error: 'Failed to file report', details: error.message });
    }
});

// Lists the blocks the authenticated user has initiated, with peer details for display.
app.get('/api/blocks', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    try {
        const blocks = await basePrisma.userBlocks.findMany({
            where: { blocker_id: req.dbUser.user_id },
            include: {
                blocked: {
                    select: { user_id: true, email: true, first_name: true, last_name: true, profile_picture_url: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
        res.json({ blocks });
    } catch (error: any) {
        console.error('[GET /api/blocks] Error:', error);
        res.status(500).json({ error: 'Failed to fetch blocks', details: error.message });
    }
});

// Blocks another user. Side-effects on existing relationships:
//  - any accepted/pending Connection between the pair is set to 'blocked'
//  - any pending IntroRequest in either direction is declined
app.post('/api/blocks', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const { blocked_id } = req.body;
    if (!blocked_id) return res.status(400).json({ error: 'blocked_id is required.' });
    if (blocked_id === req.dbUser.user_id) {
        return res.status(400).json({ error: 'You cannot block yourself.' });
    }

    const userId = req.dbUser.user_id;

    try {
        // Upsert the block. Idempotent — re-blocking doesn't change anything.
        const block = await basePrisma.userBlocks.upsert({
            where: { blocker_id_blocked_id: { blocker_id: userId, blocked_id } },
            create: { blocker_id: userId, blocked_id },
            update: {},
        });

        // Soft-hide existing accepted/pending connection so neither party sees it.
        await basePrisma.connections.updateMany({
            where: {
                OR: [
                    { user_id_a: userId, user_id_b: blocked_id },
                    { user_id_a: blocked_id, user_id_b: userId },
                ],
                status: { in: ['accepted', 'pending'] },
            },
            data: { status: 'blocked' },
        });

        // Auto-decline pending intro requests between the two users in either direction.
        await basePrisma.introRequests.updateMany({
            where: {
                status: 'pending',
                OR: [
                    { requester_id: userId, target_id: blocked_id },
                    { requester_id: blocked_id, target_id: userId },
                    { connector_id: userId, target_id: blocked_id },
                    { connector_id: blocked_id, target_id: userId },
                ],
            },
            data: { status: 'declined', responded_at: new Date() },
        });

        console.log(`[POST /api/blocks] Block created | blocker: ${userId} | blocked: ${blocked_id}`);
        res.status(201).json({ block });
    } catch (error: any) {
        console.error('[POST /api/blocks] Error:', error);
        res.status(500).json({ error: 'Failed to create block', details: error.message });
    }
});

// Removes a block. The hidden connection/intro records stay in their blocked/
// declined state — users must re-request to reconnect.
app.delete('/api/blocks/:blockedId', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });

    const blockedId = req.params.blockedId as string;
    try {
        await basePrisma.userBlocks.deleteMany({
            where: { blocker_id: req.dbUser.user_id, blocked_id: blockedId },
        });
        console.log(`[DELETE /api/blocks] Unblocked | blocker: ${req.dbUser.user_id} | blocked: ${blockedId}`);
        res.status(200).json({ message: 'Block removed.' });
    } catch (error: any) {
        console.error('[DELETE /api/blocks] Error:', error);
        res.status(500).json({ error: 'Failed to remove block', details: error.message });
    }
});

// Permanently deletes the authenticated user's account and all associated data
app.delete('/api/me', async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ message: 'User not found in database.' });
    
    const userId = req.dbUser.user_id;
    const firebaseUid = req.dbUser.firebase_uid;

    console.log(`[DELETE /api/me] Starting deletion for user: ${req.dbUser.email} (ID: ${userId})`);

    try {
        await deleteUserAccount(userId, firebaseUid);
        console.log(`[DELETE /api/me] Account successfully deleted for: ${userId}`);
        res.status(200).json({ message: 'Account deleted successfully.' });

    } catch (error: any) {
        console.error('[DELETE /api/me] Deletion failed:', error);
        res.status(500).json({ error: 'Failed to delete account', details: error.message });
    }
});

// Admin-only (dev) deletion of any user
app.delete('/api/dev/users/:id', async (req: AuthRequest, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production.' });
    }

    const targetId = req.params.id;
    
    try {
        const user = await basePrisma.users.findUnique({
            where: { user_id: targetId },
            select: { user_id: true, email: true, firebase_uid: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        console.log(`[DELETE /api/dev/users/:id] Admin deleting user: ${user.email} (ID: ${targetId})`);
        await deleteUserAccount(user.user_id, user.firebase_uid);
        
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error: any) {
        console.error('[DELETE /api/dev/users/:id] Error:', error);
        res.status(500).json({ error: 'Failed to delete user', details: error.message });
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

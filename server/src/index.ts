import express from 'express';
import cors from 'cors';
import { verifyToken, dbUserMiddleware, AuthRequest } from './middleware/authMiddleware';
import { basePrisma } from './lib/prisma';
import { getPathsForUser } from './services/pathDiscovery';
import { calculateBatchWarmthScores } from './services/gemini';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 5001;

// -- Standard Middleware --
// Allows Vite fontend to make requests to this server
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

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
                ...(first_name && { first_name }),
                ...(last_name && { last_name }),
            },
            create: {
                email,
                firebase_uid: uid,
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
    const { status } = req.body;

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
            data: { status, responded_at: new Date() },
        });

        console.log(`[PATCH /api/requests/${id}] Status set to ${status} by user_id: ${req.dbUser.user_id}`);
        res.json({ request: updated });
    } catch (error: any) {
        console.error(`[PATCH /api/requests/${id}] Error:`, error);
        res.status(500).json({ error: 'Failed to update request', details: error.message });
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

    // Starts the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
import express from 'express';
import cors from 'cors';
import { verifyToken, dbUserMiddleware, AuthRequest } from './middleware/authMiddleware';
import { basePrisma } from './lib/prisma';
import "dotenv/config";
const app = express();
const PORT = process.env.PORT || 5000;

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
import express from 'express';
import cors from 'cors';
import { verifyToken, AuthRequest } from './middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
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

// -- Protected route
app.get('/api/test-auth', verifyToken, (req: AuthRequest, res) => {
    
    const userUid = req.user?.uid;
    const userEmail = req.user?.email;

    console.log(`Secure request received from: ${userEmail}`);

    res.json({
        message: "Authenticated request successful!",
        userUid,
        userEmail
    });
});

// Create or sync user after Firebase registration
app.post('/api/users', verifyToken, async (req: AuthRequest, res) => {
    try {
        const { uid, email } = req.user;
        
        // Use Prisma to create the user in the database
        // We use upsert so it doesn't fail if the user already exists
        const user = await (prisma as any).user.upsert({
            where: { id: uid },
            update: { email: email },
            create: {
                id: uid,
                email: email,
                // Add default values for other required fields if any
            },
        });

        res.status(201).json({
            message: "User synced successfully",
            user
        });
    } catch (error: any) {
        console.error("Error syncing user:", error);
        res.status(500).json({ error: "Failed to sync user with database", details: error.message });
    }
});

    // Starts the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
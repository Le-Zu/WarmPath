import express from 'express';
import cors from 'cors';
import { verifyToken, dbUserMiddleware, AuthRequest } from './middleware/authMiddleware';

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

    // Starts the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
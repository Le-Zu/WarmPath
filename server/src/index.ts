import express from 'express';
import cors from 'cors';
import { verifyToken, AuthRequest } from './middleware/authMiddleware';

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

    console.log('Secure request received from: ${userEmail}');

    res.json({
        message: "Authenticated request successful!",
        userUid,
        userEmail
    });
    })

    // Starts the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
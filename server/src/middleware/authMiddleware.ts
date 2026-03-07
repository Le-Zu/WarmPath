import { Request, Response, NextFunction} from 'express';
import { adminAuth } from '../config/firebase.js';

// Extends the Express Request interface so TypeScript knows about the new 'user' property
export interface AuthRequest extends Request {
    user?: any;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    
    // Grab the token from the Authorization header
    const authHeader = req.headers.authorization;

    // Addeed 'typeof' check to guarantee authHeader is a string
    if(!authHeader || typeof authHeader != 'string' || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Strip out the 'Bearer ' part to get just the token string
    const token = authHeader.split(' ')[1];

    try {
        // Ask Firebase to cryptography verify the token
        const decodedToken = await adminAuth.verifyIdToken(token);

        // Success! Atach the user's Firebase data (i.g. UID)
        req.user = decodedToken;

        // Pass control to your actual route handler
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};  
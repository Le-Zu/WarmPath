import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebase.js';
import { prisma } from '../lib/prisma';
import { storage } from '../lib/cls';

// Extends the Express Request interface so TypeScript knows about the new 'user' property
export interface AuthRequest extends Request {
    user?: any;
    dbUser?: any;
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

export const dbUserMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.email) {
        return next();
    }

    try {
        // Look up the user in our database using the email from Firebase
        const user = await prisma.users.findUnique({
            where: { email: req.user.email }
        });

        if (user) {
            req.dbUser = user;
            // Wrap the rest of the request in the AsyncLocalStorage context
            storage.run({ userId: user.user_id }, () => {
                next();
            });
        } else {
            next();
        }
    } catch (error) {
        console.error('Error in dbUserMiddleware:', error);
        next();
    }
};
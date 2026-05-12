import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { adminAuth } from '../config/firebase';
import { basePrisma } from '../lib/prisma';

export let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust in production
            methods: ["GET", "POST"]
        }
    });

    // Socket Authentication Middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            const decodedToken = await adminAuth.verifyIdToken(token);
            // Attach user info to socket
            (socket as any).user = decodedToken;
            
            // Fetch DB user to get user_id
            const dbUser = await basePrisma.users.findUnique({
                where: { email: decodedToken.email }
            });

            if (!dbUser) {
                return next(new Error('Authentication error: User not found in database'));
            }

            (socket as any).dbUser = dbUser;
            next();
        } catch (error) {
            console.error('Socket Auth Error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const dbUser = (socket as any).dbUser;
        console.log(`User connected to socket: ${dbUser.email} (${socket.id})`);

        socket.on('join_conversation', (conversationId: string) => {
            // Check if user is a participant
            basePrisma.conversationParticipants.findFirst({
                where: { conversation_id: conversationId, user_id: dbUser.user_id }
            }).then(participant => {
                if (participant) {
                    socket.join(conversationId);
                    console.log(`User ${dbUser.email} joined room: ${conversationId}`);
                } else {
                    console.warn(`User ${dbUser.email} tried to join room they aren't in: ${conversationId}`);
                }
            });
        });

        socket.on('leave_conversation', (conversationId: string) => {
            socket.leave(conversationId);
            // Broadcast to others that this user left
            io.to(conversationId).emit('user_left', {
                userId: dbUser.user_id,
                leftAt: new Date().toISOString()
            });
            console.log(`User ${dbUser.email} left room: ${conversationId}`);
        });

        socket.on('send_message', async (data: { conversationId: string, body: string }) => {
            const { conversationId, body } = data;

            try {
                // Verify participation again for safety
                const participant = await basePrisma.conversationParticipants.findFirst({
                    where: { conversation_id: conversationId, user_id: dbUser.user_id }
                });

                if (!participant) return;

                const message = await basePrisma.messages.create({
                    data: {
                        conversation_id: conversationId,
                        sender_id: dbUser.user_id,
                        body: body,
                    },
                    include: {
                        sender: { select: { first_name: true, last_name: true } }
                    }
                });

                // Broadcast to the room
                io.to(conversationId).emit('new_message', message);
            } catch (error) {
                console.error('Error sending socket message:', error);
            }
        });

        socket.on('typing', (data: { conversationId: string, isTyping: boolean }) => {
            socket.to(data.conversationId).emit('user_typing', {
                userId: dbUser.user_id,
                isTyping: data.isTyping,
                userName: `${dbUser.first_name} ${dbUser.last_name}`
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${dbUser.email}`);
        });
    });

    return io;
};

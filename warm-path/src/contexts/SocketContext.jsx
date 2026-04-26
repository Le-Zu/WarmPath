import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SocketContext } from './SocketContextInstance';

export const SocketProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        let activeSocket = null;

        if (currentUser) {
            currentUser.getIdToken().then(token => {
                activeSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
                    auth: { token }
                });

                setSocket(activeSocket);
            });
        }

        return () => {
            if (activeSocket) {
                activeSocket.close();
            }
        };
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser && socket) {
            socket.close();
            setSocket(null);
        }
    }, [currentUser, socket]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

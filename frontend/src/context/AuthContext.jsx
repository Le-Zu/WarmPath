import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';

// Create the Context
const AuthContext = createContext();

// Export a custom hook so components can easily access the context
export function useAuth() {
  return useContext(AuthContext);
}

// Create the Provider component
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [pending, setPending] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setPending(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!pending && children}
        </AuthContext.Provider>
    );
}

export default AuthContext;


import { createContext, useState, useEffect, useContext } from 'react';
import { getMe } from '../api/user.js';
import { useAuth } from './AuthContext.jsx';

export const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const { currentUser: firebaseUser } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseUser) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getMe()
      .then(({ user }) => {
        setCurrentUser(user);
        setError(null);
      })
      .catch((err) => {
        console.error('[UserContext] Failed to fetch profile:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [firebaseUser]);

  const refreshUser = async () => {
    if (!firebaseUser) return;
    try {
      const { user } = await getMe();
      setCurrentUser(user);
      setError(null);
    } catch (err) {
      console.error('[UserContext] Failed to refresh profile:', err);
      setError(err.message);
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, refreshUser, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}

import { createContext, useContext, useState } from 'react';
import { users } from '../data/mockData';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(users[0]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, allUsers: users }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

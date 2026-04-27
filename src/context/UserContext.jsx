import { createContext, useState } from 'react';
import { mockUsers } from '../data/mockData.js';
export const UserContext = createContext();
export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(mockUsers[0]);
  return <UserContext.Provider value={{ currentUser, setCurrentUser }}>{children}</UserContext.Provider>;
}

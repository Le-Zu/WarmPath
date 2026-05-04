import { useContext } from 'react';
import { UserContext } from '../context/UserContext.jsx';
import { mockUsers } from '../data/mockData.js';
export default function UserSwitcher() {
  const { currentUser, setCurrentUser } = useContext(UserContext);
  return (
    <div className="user-switcher">
      <select value={currentUser.id} onChange={e => setCurrentUser(mockUsers.find(u => u.id === e.target.value))}>
        {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
    </div>
  );
}

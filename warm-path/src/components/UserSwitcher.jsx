import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext.jsx';
import { mockUsers } from '../data/mockData.js';
export default function UserSwitcher({ light }) {
  const { currentUser, setCurrentUser } = useContext(UserContext);
  return (
    <div className="user-switcher">
      <select
        value={currentUser.id}
        onChange={e => setCurrentUser(mockUsers.find(u => u.id === e.target.value))}
        style={{
          background: light ? 'transparent' : 'rgba(255,255,255,0.1)',
          color: light ? '#2d2a26' : 'var(--cream)',
          border: light ? '1px solid #d0c8c2' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: '2px',
          padding: '0.3rem 0.6rem',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
        }}>
        {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
    </div>
  );
}

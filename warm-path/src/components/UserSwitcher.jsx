import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';
import apiFetch from '../api/client.js';

const SEED_PASSWORD = 'Password123!';

export default function UserSwitcher({ light }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    apiFetch('/api/dev/users')
      .then(({ users }) => setUsers(users))
      .catch((err) => console.error('[UserSwitcher] Failed to load users:', err));
  }, []);

  const handleSwitch = () => {
    if (!selected || switching) return;
    setSwitching(true);
    signInWithEmailAndPassword(auth, selected, SEED_PASSWORD)
      .catch((err) => console.error('[UserSwitcher] Sign-in failed:', err))
      .finally(() => setSwitching(false));
  };

  if (users.length === 0) return null;

  const selectStyle = {
    background: light ? 'transparent' : 'rgba(255,255,255,0.1)',
    color: light ? '#2d2a26' : 'var(--cream)',
    border: light ? '1px solid #d0c8c2' : '1px solid rgba(255,255,255,0.2)',
    borderRadius: '2px',
    padding: '0.3rem 0.6rem',
    fontSize: '0.78rem',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    maxWidth: '170px',
  };

  const btnStyle = {
    background: switching || !selected ? (light ? '#d0c8c2' : 'rgba(255,255,255,0.15)') : '#e76f51',
    color: light ? (switching || !selected ? '#999' : '#fff') : 'var(--cream)',
    border: 'none',
    borderRadius: '2px',
    padding: '0.3rem 0.65rem',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-sans)',
    cursor: switching || !selected ? 'default' : 'pointer',
  };

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      <select value={selected} onChange={e => setSelected(e.target.value)} disabled={switching} style={selectStyle}>
        <option value="">Switch user…</option>
        {users.map(u => (
          <option key={u.user_id} value={u.email}>
            {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}{u.year ? ` · ${u.year}` : ''}
          </option>
        ))}
      </select>
      <button onClick={handleSwitch} disabled={!selected || switching} style={btnStyle}>
        {switching ? '…' : 'Go'}
      </button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';
import apiFetch from '@/services/client';

const SEED_PASSWORD = 'Password123!';

export default function UserSwitcher({ light }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [switching, setSwitching] = useState(false);
  const [confirmStage, setConfirmStage] = useState(0); // 0: none, 1: sure?, 2: REALLY?

  const fetchUsers = () => {
    apiFetch('/api/dev/users')
      .then(({ users }) => setUsers(users))
      .catch((err) => console.error('[UserSwitcher] Failed to load users:', err));
  };

  useEffect(() => {
    fetchUsers();
    window.addEventListener('dev-users-updated', fetchUsers);
    return () => window.removeEventListener('dev-users-updated', fetchUsers);
  }, []);

  useEffect(() => { setConfirmStage(0); }, [selected]);

  const handleSwitch = async () => {
    if (!selected || switching) return;
    setSwitching(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, selected, SEED_PASSWORD);
      const token = await userCredential.user.getIdToken();
      
      // Sync with backend to ensure DB record exists (resurrection)
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: '', 
          last_name: ''
        })
      });

      window.location.reload();
    } catch (err) {
      alert('Switch failed: ' + err.message);
    } finally {
      setSwitching(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || switching) return;
    if (confirmStage === 0) { setConfirmStage(1); return; }
    if (confirmStage === 1) { setConfirmStage(2); return; }

    const user = users.find(u => u.email === selected);
    if (!user) return;

    setSwitching(true);
    try {
      await apiFetch(`/api/dev/users/${user.user_id}`, { method: 'DELETE' });
      setSelected('');
      setConfirmStage(0);
      fetchUsers();
    } catch (err) {
      alert('Delete failed: ' + err.message);
      setConfirmStage(0);
    } finally {
      setSwitching(false);
    }
  };

  if (users.length === 0) return null;

  const btnStyle = {
    background: switching || !selected ? (light ? '#d0c8c2' : 'rgba(255,255,255,0.15)') : '#e76f51',
    color: light ? (switching || !selected ? '#999' : '#fff') : 'var(--cream)',
    border: 'none', borderRadius: '2px', padding: '0.3rem 0.65rem', fontSize: '0.75rem', cursor: switching || !selected ? 'default' : 'pointer'
  };

  const getLabel = (u) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email;
    const tags = [];
    if (u.firebase_uid && u.firebase_uid.startsWith('google.com')) tags.push('G');
    else if (!u.is_active) tags.push('Gst');
    else if (u.email && (u.email.includes('uni.edu') || u.email.includes('example.com'))) tags.push('M');
    else tags.push('P');

    const mode = u.privacy_settings?.discovery_mode || 'full';
    if (mode === 'anonymous') tags.push('anon');
    if (mode === 'hidden') tags.push('hide');

    return `${name} [${tags.join('|')}]${u.year ? ` · ${u.year}` : ''}`;
  };

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      <select value={selected} onChange={e => setSelected(e.target.value)} disabled={switching} style={{ background: light ? 'transparent' : 'rgba(255,255,255,0.1)', color: light ? '#2d2a26' : 'var(--cream)', border: '1px solid #d0c8c2', borderRadius: '2px', padding: '0.3rem', fontSize: '0.75rem', maxWidth: '150px' }}>
        <option value="">Switch user…</option>
        {users.map(u => <option key={u.user_id} value={u.email}>{getLabel(u)}</option>)}
      </select>
      {confirmStage === 0 && <button onClick={handleSwitch} disabled={!selected || switching} style={btnStyle}>{switching ? '…' : 'Go'}</button>}
      {selected && !switching && <button onClick={handleDelete} style={{ ...btnStyle, background: confirmStage > 0 ? '#b11d1d' : '#c0392b' }}>{confirmStage === 1 ? 'Sure?' : confirmStage === 2 ? 'REALLY?' : '🗑️'}</button>}
      {confirmStage > 0 && <button onClick={() => setConfirmStage(0)} style={{ ...btnStyle, background: '#7a6f68' }}>esc</button>}
    </div>
  );
}

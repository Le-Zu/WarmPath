import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext.jsx';
export default function Profile() {
  const { currentUser } = useContext(UserContext);
  return (
    <div className="app-page">
      <div style={{ background: 'var(--dark)', borderRadius: 2, padding: '2rem', marginBottom: '1.5rem', color: 'var(--cream)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{currentUser.avatar}</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '0.25rem' }}>{currentUser.name}</div>
        <div style={{ fontSize: '0.85rem', color: 'rgba(242,233,228,0.7)' }}>{currentUser.major} · {currentUser.year}</div>
      </div>
      <div className="app-card">
        <div className="app-eyebrow" style={{ marginBottom: '0.75rem' }}>About</div>
        <p style={{ fontSize: '0.88rem', color: '#5a5550', lineHeight: 1.6 }}>
          Looking to break into tech and connect with people doing meaningful research.
          Open to warm introductions for internships, research labs, and student orgs.
        </p>
      </div>
    </div>
  );
}

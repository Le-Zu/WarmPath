import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext.jsx';

export default function Profile() {
  const { currentUser, loading, error } = useContext(UserContext);

  if (loading) return <div className="app-page">Loading profile...</div>;
  if (error) return <div className="app-page">Failed to load profile.</div>;
  if (!currentUser) return null;

  const fullName = [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email;

  return (
    <div className="app-page">
      <div style={{ background: 'var(--dark)', borderRadius: 2, padding: '2rem', marginBottom: '1.5rem', color: 'var(--cream)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
          {currentUser.profile_picture_url
            ? <img src={currentUser.profile_picture_url} alt="Profile" style={{ width: '3rem', height: '3rem', borderRadius: '50%' }} />
            : '👤'}
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '0.25rem' }}>{fullName}</div>
        <div style={{ fontSize: '0.85rem', color: 'rgba(242,233,228,0.7)' }}>
          {[currentUser.major, currentUser.year].filter(Boolean).join(' · ')}
        </div>
      </div>
      {currentUser.bio && (
        <div className="app-card">
          <div className="app-eyebrow" style={{ marginBottom: '0.75rem' }}>About</div>
          <p style={{ fontSize: '0.88rem', color: '#5a5550', lineHeight: 1.6 }}>{currentUser.bio}</p>
        </div>
      )}
    </div>
  );
}

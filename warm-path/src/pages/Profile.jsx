import { useContext, useState, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext.jsx';
import { getConnections } from '../api/connections';

export default function Profile() {
  const { currentUser, loading, error } = useContext(UserContext);
  const [connections, setConnections] = useState([]);
  const [loadingConns, setLoadingConns] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setLoadingConns(true);
      getConnections()
        .then(data => setConnections(data.connections || []))
        .catch(err => console.error('Failed to fetch connections:', err))
        .finally(() => setLoadingConns(false));
    }
  }, [currentUser]);

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          {currentUser.bio && (
            <div className="app-card" style={{ marginBottom: '1.5rem' }}>
              <div className="app-eyebrow" style={{ marginBottom: '0.75rem' }}>About</div>
              <p style={{ fontSize: '0.88rem', color: '#5a5550', lineHeight: 1.6 }}>{currentUser.bio}</p>
            </div>
          )}

          {currentUser.interests?.length > 0 && (
            <div className="app-card" style={{ marginBottom: '1.5rem' }}>
              <div className="app-eyebrow" style={{ marginBottom: '0.75rem' }}>Interests</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {currentUser.interests.map(i => (
                  <span key={i.interest_id} className="tag tag-approved" style={{ fontSize: '0.75rem' }}>
                    {i.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {currentUser.experiences?.length > 0 && (
            <div className="app-card">
              <div className="app-eyebrow" style={{ marginBottom: '0.75rem' }}>Experience</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentUser.experiences.map(e => (
                  <div key={e.experience_id}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--charcoal)' }}>{e.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#7a6f68' }}>{e.organization}</div>
                    {e.description && (
                      <p style={{ fontSize: '0.8rem', color: '#5a5550', marginTop: '0.25rem' }}>{e.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="app-card">
            <div className="app-eyebrow" style={{ marginBottom: '0.75rem' }}>My Network</div>
            {loadingConns ? (
              <div style={{ fontSize: '0.85rem', color: '#888' }}>Loading network...</div>
            ) : connections.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#888' }}>You haven't added any connections yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {connections.map(c => (
                  <div key={c.connection_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>👤</div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{[c.peer.first_name, c.peer.last_name].filter(Boolean).join(' ')}</div>
                      <div style={{ fontSize: '0.75rem', color: '#7a6f68' }}>{c.context}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

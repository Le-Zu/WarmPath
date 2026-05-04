import { useContext } from 'react';
import { UserContext } from '../context/UserContext.jsx';
export default function Profile() {
  const { currentUser } = useContext(UserContext);
  return (
    <div className="page">
      <div className="profile-hero">
        <div className="profile-avatar">{currentUser.avatar}</div>
        <div className="profile-name">{currentUser.name}</div>
        <div className="profile-meta">{currentUser.major} · {currentUser.year}</div>
      </div>
      <div className="card">
        <div className="page-eyebrow" style={{ marginBottom: '0.75rem' }}>About</div>
        <p className="profile-bio">
          Looking to break into tech and connect with people doing meaningful research.
          Open to warm introductions for internships, research labs, and student orgs.
        </p>
      </div>
    </div>
  );
}

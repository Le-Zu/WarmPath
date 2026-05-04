import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';

export default function ProfileCompletionNudge() {
  const { currentUser } = useUser();
  const nav = useNavigate();

  if (!currentUser) return null;

  const missingFields = [];
  if (!currentUser.first_name || !currentUser.last_name) missingFields.push('name');
  if (!currentUser.major) missingFields.push('major');
  if (!currentUser.year) missingFields.push('year');
  if (!currentUser.bio) missingFields.push('bio');
  if (!currentUser.interests || currentUser.interests.length === 0) missingFields.push('interests');
  if (!currentUser.experiences || currentUser.experiences.length === 0) missingFields.push('experience');

  if (missingFields.length === 0) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      background: '#fff3f0',
      border: '1px solid #ffccbc',
      borderRadius: '4px',
      padding: '1rem',
      marginBottom: '2rem',
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#d84315' }}>
        Complete your profile 🚀
      </div>
      <div style={{ fontSize: '0.8rem', color: '#5d4037' }}>
        Help others find you by adding your {missingFields.join(', ')}.
      </div>
      <button 
        onClick={() => nav('/settings')}
        style={{
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          color: '#e64a19',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          padding: '0',
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
      >
        Go to Settings
      </button>
    </div>
  );
}

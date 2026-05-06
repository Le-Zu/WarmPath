import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Microscope, BookOpen, Users, Wrench } from 'lucide-react';
import apiFetch from '@/services/client';
import ProfileCompletionNudge from '../components/ProfileCompletionNudge';
import { useToast } from '@/context/ToastContext';

const intents = [
  { id: 'internship', icon: Briefcase,  label: 'Internship', desc: 'Find someone with industry experience in your target field' },
  { id: 'research',   icon: Microscope, label: 'Research',   desc: 'Connect with a professor or lab doing work you care about' },
  { id: 'class',      icon: BookOpen,   label: 'Class Help', desc: 'Get connected to someone who aced the course you\'re struggling in' },
  { id: 'club',       icon: Users,      label: 'Club / Org', desc: 'Find a warm intro into a club, team, or student org' },
  { id: 'skill',      icon: Wrench,     label: 'Skill',      desc: 'Learn a new skill from someone in your network' },
];

export default function Home() {
  const nav = useNavigate();
  const toast = useToast();
  const [loadingId, setLoadingId] = useState(null);

  const handleSelect = async (id, label) => {
    setLoadingId(id);
    try {
      await apiFetch('/api/intents', {
        method: 'POST',
        body: JSON.stringify({
          category: id,
          description: `Looking for: ${label}`,
        }),
      });
      nav(`/paths?intent=${id}`);
    } catch (err) {
      console.error('Failed to save intent:', err);
      toast('Failed to set your goal: ' + err.message, 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="app-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <ProfileCompletionNudge />
      <div className="app-eyebrow">— Declare your intent —</div>
      <div className="app-page-title">What are you<br />looking for?</div>
      <div className="app-page-sub">Choose a goal and we'll surface the best warm paths for you.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: 480 }}>
        {intents.map(it => (
          <button key={it.id} 
            disabled={loadingId !== null}
            onClick={() => handleSelect(it.id, it.label)}
            style={{ 
              background: 'var(--white)', 
              border: '1.5px solid var(--border)', 
              borderRadius: 2, 
              padding: '1rem 1.25rem', 
              textAlign: 'left', 
              cursor: loadingId !== null ? 'not-allowed' : 'pointer', 
              transition: 'border-color 0.15s, box-shadow 0.15s', 
              fontFamily: 'var(--font-sans)',
              opacity: loadingId !== null && loadingId !== it.id ? 0.6 : 1,
              position: 'relative'
            }}
            onMouseEnter={e => { if (loadingId === null) { e.currentTarget.style.borderColor = 'var(--warm)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(231,111,81,0.15)'; } }}
            onMouseLeave={e => { if (loadingId === null) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; } }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--dark)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <it.icon size={18} strokeWidth={2} />
              {it.label}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#7a6f68' }}>
              {loadingId === it.id ? 'Saving...' : it.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

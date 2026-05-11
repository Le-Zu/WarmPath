import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Microscope, BookOpen, Users, Wrench, X, Coffee } from 'lucide-react';
import apiFetch from '@/services/client';
import { getConnections } from '@/services/connections';
import ProfileCompletionNudge from '../components/ProfileCompletionNudge';
import ConnectionNudge from '@/components/ConnectionNudge';
import StatusEditor from '@/components/StatusEditor';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';

const intents = [
  { id: 'internship', icon: Briefcase,  label: 'Internship', desc: 'Find someone with industry experience in your target field' },
  { id: 'research',   icon: Microscope, label: 'Research',   desc: 'Connect with a professor or lab doing work you care about' },
  { id: 'class',      icon: BookOpen,   label: 'Class Help', desc: 'Get connected to someone who aced the course you\'re struggling in' },
  { id: 'club',       icon: Users,      label: 'Club',       desc: 'Find a warm intro into a club, team, or student org' },
  { id: 'skill',      icon: Wrench,     label: 'Skill',      desc: 'Learn a new skill from someone in your network' },
  { id: 'coffee',     icon: Coffee,     label: 'Coffee Chat', desc: 'Connect for a casual chat, advice, or general networking' },
];

export default function Home() {
  const nav = useNavigate();
  const toast = useToast();
  const { currentUser, refreshUser } = useUser();
  const [loadingId, setLoadingId] = useState(null);
  const [connectorCount, setConnectorCount] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    getConnections()
      .then((data) => setConnectorCount((data.connections || []).length))
      .catch(() => setConnectorCount(null));
  }, []);

  const handleSaveStatus = async (text, expiresAt) => {
    setSavingStatus(true);
    try {
      await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({
          intent_status: text,
          intent_status_expires_at: expiresAt ? expiresAt.toISOString() : null,
        }),
      });
      await refreshUser();
      toast('Status saved.');
      setStatusOpen(false);
    } catch (err) {
      toast(`Failed to save status: ${err.message || 'unknown error'}`, 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleClearStatus = async () => {
    setSavingStatus(true);
    try {
      await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ intent_status: '' }),
      });
      await refreshUser();
      toast('Status cleared.');
      setStatusOpen(false);
    } catch (err) {
      toast(`Failed to clear status: ${err.message || 'unknown error'}`, 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  const hasStatus = Boolean(currentUser?.intent_status);

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
    <div className="app-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 800 }}>
      <ProfileCompletionNudge />
      <div className="app-eyebrow" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>— What are you looking for —</div>
      <div className="app-page-title" style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>What are you<br />looking for?</div>
      <div className="app-page-sub" style={{ fontSize: '1rem', marginBottom: '2.5rem', maxWidth: 600 }}>Choose a goal and we'll find the best connections to help you get there.</div>

      <div style={{ width: '100%', maxWidth: 600, marginTop: '0.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
        {hasStatus ? (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              background: 'rgba(231, 111, 81, 0.06)',
              border: '1px solid rgba(231, 111, 81, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <span style={{ fontSize: '0.9rem', color: 'var(--dark)', lineHeight: 1.5 }}>
              {currentUser.intent_status}
            </span>
            <button
              type="button"
              onClick={() => setStatusOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--warm)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Update
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setStatusOpen(true)}
            style={{
              background: 'transparent',
              border: '1px dashed rgba(231, 111, 81, 0.4)',
              color: 'var(--warm)',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            + Set a status
          </button>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: 600, marginBottom: '2.5rem' }}>
        <ConnectionNudge count={connectorCount} />
      </div>

      {statusOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setStatusOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '2rem',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setStatusOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                background: 'transparent',
                border: 'none',
                color: '#7a6f68',
                cursor: 'pointer',
                padding: '0.4rem',
                display: 'inline-flex',
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--dark)', marginTop: 0, marginBottom: '0.5rem' }}>
              Set your status
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#7a6f68', marginTop: 0, marginBottom: '1.5rem' }}>
              A short note that shows on your Profile and the path cards your contacts see.
            </p>
            <StatusEditor
              initialStatus={currentUser?.intent_status || ''}
              initialExpiresAt={currentUser?.intent_status_expires_at || null}
              saving={savingStatus}
              onSave={handleSaveStatus}
              onClear={handleClearStatus}
            />
          </div>
        </div>
      )}
      
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.25rem', 
          width: '100%', 
          maxWidth: 800 
        }}
      >
        {intents.map(it => (
          <button key={it.id} 
            disabled={loadingId !== null}
            onClick={() => handleSelect(it.id, it.label)}
            style={{ 
              background: 'var(--white)', 
              border: '1.5px solid var(--border)', 
              borderRadius: 4, 
              padding: '1.5rem 1.75rem', 
              textAlign: 'left', 
              cursor: loadingId !== null ? 'not-allowed' : 'pointer', 
              transition: 'all 0.15s', 
              fontFamily: 'var(--font-sans)',
              opacity: loadingId !== null && loadingId !== it.id ? 0.6 : 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
            onMouseEnter={e => { if (loadingId === null) { e.currentTarget.style.borderColor = 'var(--warm)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(231,111,81,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
            onMouseLeave={e => { if (loadingId === null) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; } }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <it.icon size={22} strokeWidth={2} />
              {it.label}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#7a6f68', lineHeight: 1.4 }}>
              {loadingId === it.id ? 'Saving...' : it.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Microscope, BookOpen, Users, Wrench, X, Coffee } from 'lucide-react';
import apiFetch from '@/services/client';
import { getConnections } from '@/services/connections';
import { getPaths } from '@/services/paths';
import { WarmthScore } from "@/features/gemini";
import ProfileCompletionNudge from '../components/ProfileCompletionNudge';
import ConnectionNudge from '@/components/ConnectionNudge';
import StatusEditor from '@/components/StatusEditor';
import InfoTooltip from '@/components/InfoTooltip';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import LivingNetworkWidget from '@/components/LivingNetworkWidget';
import { PathCard } from '@/features/paths';

const intents = [
  { id: 'coffee',     icon: Coffee,     label: 'Coffee Chat', desc: 'Connect for a casual chat, advice, or general networking' },
  { id: 'internship', icon: Briefcase,  label: 'Internship', desc: 'Find someone with industry experience in your target field' },
  { id: 'research',   icon: Microscope, label: 'Research',   desc: 'Connect with a professor or lab doing work you care about' },
  { id: 'class',      icon: BookOpen,   label: 'Class Help', desc: 'Get connected to someone who aced the course you\'re struggling in' },
  { id: 'club',       icon: Users,      label: 'Club',       desc: 'Find a warm intro into a club, team, or student org' },
  { id: 'skill',      icon: Wrench,     label: 'Skill',      desc: 'Learn a new skill from someone in your network' },
];

export default function Home() {
  const nav = useNavigate();
  const toast = useToast();
  const { currentUser, refreshUser } = useUser();
  const [loadingId, setLoadingId] = useState(null);
  const [connections, setConnections] = useState([]);
  const [paths, setPaths] = useState([]);
  const [statusOpen, setStatusOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [viewMore, setViewMore] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    Promise.all([getConnections(), getPaths()])
      .then(([connData, pathData]) => {
        setConnections(connData.connections || []);
        setPaths(pathData.paths || []);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
      });

    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  const connectorCount = connections.filter(c => c.status === 'accepted').length;
  const pendingCount = connections.filter(c => c.status === 'pending').length;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newCount = connections.filter(c => c.status === 'accepted' && new Date(c.accepted_at || c.created_at) > sevenDaysAgo).length;

  const warmestPath = paths[0];
  const intentLabel = warmestPath
    ? intents.find((i) => i.id === warmestPath.intent_category)?.label
    : null;
  const mappedPath = warmestPath ? {
    pathId: warmestPath.path_id,
    intentLabel,
    connector: {
       name: [
          warmestPath.connector_first_name,
          warmestPath.connector_last_name,
       ].filter(Boolean).join(" "),
       pictureUrl: warmestPath.connector_picture_url,
       relation: warmestPath.requester_connector_context,
       targetRelation: warmestPath.connector_target_context,
    },
    target: {
       name: [
          warmestPath.target_first_name,
          warmestPath.target_last_name,
       ].filter(Boolean).join(" "),
       pictureUrl: warmestPath.target_picture_url,
       role: warmestPath.target_major || "Student",
       isAnonymous: warmestPath.target_is_anonymous,
       intentStatus: warmestPath.target_intent_status,
       interests: warmestPath.target_interests,
    },
  } : null;

  return (
    <div className="app-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <ProfileCompletionNudge />
      
      {/* Welcome Hero Card */}
      <div
        style={{
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #fceddb 0%, #f4eae1 100%)',
          borderRadius: '12px',
          padding: '1.75rem 2rem',
          border: '1.5px solid rgba(231,111,81,0.2)',
          boxShadow: '0 4px 20px rgba(231,111,81,0.06)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: '1.5rem',
          textAlign: 'left',
          marginBottom: '2rem'
        }}
      >
        {/* Decorative flame glow, anchored top-right */}
        <svg
          viewBox="0 0 100 130"
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '-30px',
            top: '-50px',
            width: 230,
            height: 230,
            opacity: 0.16,
            pointerEvents: 'none',
          }}
        >
          <defs>
            <linearGradient id="wp-hero-flame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f4a261" />
              <stop offset="1" stopColor="#e76f51" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wp-hero-flame)"
            d="M50 4c4 18-10 26-18 40-6 11-7 22 0 32-9-3-15-12-15-12-3 10-2 22 6 31 9 10 24 13 36 6 13-7 19-22 14-37-3-9-9-15-9-24 8 6 12 14 12 14 3-15-3-31-15-42-7-7-12-12-11-8z"
          />
        </svg>

        <div style={{ flex: 1, position: 'relative' }}>
          <h1 style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '1.8rem', 
            color: 'var(--dark)', 
            fontWeight: 600, 
            margin: 0,
            lineHeight: 1.2
          }}>
            Good evening, <span style={{ color: 'var(--warm)' }}>{currentUser?.first_name || 'there'}.</span>
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#5a5550', fontStyle: hasStatus ? 'normal' : 'italic' }}>
              {hasStatus ? `“${currentUser.intent_status}”` : 'No active status set'}
            </span>
            <button 
              type="button" 
              onClick={() => setStatusOpen(true)}
              style={{
                background: 'rgba(231,111,81,0.08)',
                border: 'none',
                color: 'var(--warm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,111,81,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(231,111,81,0.08)'}
            >
              Edit
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '1.5rem' : '0',
          alignItems: 'center',
          position: 'relative',
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          borderTop: isMobile ? '1px solid rgba(231,111,81,0.1)' : 'none',
          paddingTop: isMobile ? '1rem' : 0,
        }}>
          {[
            { label: 'CONNECTORS', count: connectorCount },
            { label: 'PENDING', count: pendingCount },
            { label: 'NEW · 7D', count: newCount }
          ].map((stat, idx, arr) => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: isMobile ? '0' : '0 1.5rem',
                borderRight:
                  isMobile || idx === arr.length - 1
                    ? 'none'
                    : '1px solid rgba(231,111,81,0.15)',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--dark)', lineHeight: 1 }}>
                {stat.count}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#7a6f68', letterSpacing: '0.05em', marginTop: '0.35rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warmest Path Section */}
      <div style={{ width: '100%', textAlign: 'left', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
          <h2 style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '1.25rem', 
            color: 'var(--dark)',
            margin: 0
          }}>
            Your warmest path right now
          </h2>
          <button 
            onClick={() => nav('/paths')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--warm)',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            See all paths
          </button>
        </div>

        {warmestPath ? (
          <PathCard path={mappedPath} score={warmestPath.strength} />
        ) : (
          <div 
            style={{
              background: '#fff',
              border: '1.5px dashed var(--border)',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              color: '#7a6f68',
              fontSize: '0.9rem'
            }}
          >
            No warm paths discovered yet. Try adding direct connections (connectors) to map out paths to your peers!
          </div>
        )}
      </div>

      {/* Collapsible Living Network Widget */}
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <LivingNetworkWidget />
      </div>

      {/* Intents Heading */}
      <div style={{ width: '100%', textAlign: 'left', marginBottom: '1rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            color: 'var(--dark)',
            margin: 0,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          What are you looking for?
          <InfoTooltip
            label="About intents"
            text="Choose a goal and we'll find the best connections to help you get there."
            width={240}
          />
        </h2>
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
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '1.25rem',
          width: '100%',
        }}
      >
        {(isMobile && !viewMore ? intents.slice(0, 3) : intents).map(it => (
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

      {isMobile && intents.length > 3 && (
        <button
          type="button"
          onClick={() => setViewMore(!viewMore)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--warm)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            marginTop: '1.25rem',
            marginBottom: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          {viewMore ? 'View Less' : 'View More'}
        </button>
      )}
    </div>
  );
}

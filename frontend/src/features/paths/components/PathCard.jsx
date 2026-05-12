import { useState } from 'react';
import { User, EyeOff } from 'lucide-react';
import { IntroRequestModal } from '@/features/intros';
import { WarmthScore } from '@/features/gemini';

// Derive 1-2 letter initials from a full name. Falls back to "?" if empty.
const initials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
};

export default function PathCard({ path, score = '...', loading = false }) {
  const [open, setOpen] = useState(false);

  if (loading || !path) {
    return <PathCardSkeleton />;
  }

  return (
    <div className="app-card path-card-body">
      <div className="path-chain path-chain-fixed">
        {/* You Node */}
        <div className="path-node">
          <div className="path-dot you" title="You">YOU</div>
          <div><div className="path-node-label">You</div></div>
        </div>

        {/* You -> Connector Bridge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="path-connector-line" style={{ height: '40px' }} />
          <div style={{ fontSize: '0.72rem', color: '#888', fontStyle: 'italic', marginTop: '-4px' }}>
            {path.connector.relation || 'Connected'}
          </div>
        </div>

        {/* Connector Node */}
        <div className="path-node">
          {path.connector.pictureUrl ? (
            <img 
              src={path.connector.pictureUrl} 
              alt={path.connector.name} 
              className="path-dot connector" 
              style={{ objectFit: 'cover' }}
              title={`Connector — ${path.connector.name} (forwards your intro request)`}
            />
          ) : (
            <div className="path-dot connector" title={`Connector — ${path.connector.name} (forwards your intro request)`}>
              {initials(path.connector.name)}
            </div>
          )}
          <div>
            <div className="path-node-label">{path.connector.name}</div>
          </div>
        </div>

        {/* Connector -> Target Bridge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="path-connector-line" style={{ height: '40px' }} />
          <div style={{ fontSize: '0.72rem', color: '#888', fontStyle: 'italic', marginTop: '-4px' }}>
            {path.connector.targetRelation || 'Connected'}
          </div>
        </div>

        {/* Target Node (Chain only shows Name now) */}
        <div className="path-node">
          {!path.target.isAnonymous && path.target.pictureUrl ? (
            <img 
              src={path.target.pictureUrl} 
              alt={path.target.name} 
              className="path-dot target" 
              style={{ objectFit: 'cover' }}
              title={`Contact — ${path.target.name} (the person you want to meet)`}
            />
          ) : (
            <div className="path-dot target" title={`Contact — ${path.target.name} (the person you want to meet)`}>
              {initials(path.target.name)}
            </div>
          )}
          <div>
            <div className="path-node-label">{path.target.name}</div>
          </div>
        </div>
      </div>

      {/* Target Info Section (Right Side) */}
      <div className="path-card-info">
        <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          {path.target.isAnonymous
            ? <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EyeOff size={22} strokeWidth={1.75} color="#7a6f68" /></div>
            : path.target.pictureUrl
              ? <img src={path.target.pictureUrl} alt={path.target.name} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }} />
              : <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={22} strokeWidth={1.75} color="#7a6f68" /></div>}
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--dark)', marginBottom: '0.25rem' }}>
          {path.target.name} {path.target.isAnonymous && <span style={{ fontSize: '0.7rem', color: '#6a994e', verticalAlign: 'middle', marginLeft: '4px' }}>(Anonymous)</span>}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#7a6f68', marginBottom: path.target.intentStatus ? '0.5rem' : '1.25rem' }}>{path.target.role}</div>
        {path.target.intentStatus && (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--dark)',
              background: 'rgba(231, 111, 81, 0.05)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              marginBottom: '1.25rem',
              display: 'inline-block',
            }}
          >
            📍 {path.target.intentStatus}
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          {score === '...' ? (
            <div className="app-page-sub" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--warm)",
              fontWeight: 500,
              marginBottom: 0
            }}>
              <span className="spinner-small" />
              WarmScore AI is assessing your connections for the best matches...
            </div>
          ) : (
            <WarmthScore score={score} />
          )}
        </div>
        <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.4rem' }} onClick={() => setOpen(true)}>
          Request Intro →
        </button>
      </div>
      {open && <IntroRequestModal path={path} onClose={() => setOpen(false)} />}
    </div>
  );
}

function PathCardSkeleton() {
  return (
    <div
      className="app-card"
      style={{
        display: "flex",
        gap: "2.5rem",
        alignItems: "flex-start",
        marginBottom: "1rem",
      }}
    >
      <div className="path-chain" style={{ width: "320px", flexShrink: 0 }}>
        <div className="path-node">
          <div className="path-dot you">YOU</div>
          <div className="path-node-label">You</div>
        </div>
        <div className="path-connector-line" style={{ height: "40px" }} />
        <div className="path-node">
          <div className="path-dot connector">CON</div>
          <div
            style={{
              width: 90,
              height: 13,
              borderRadius: 2,
              background: "#e0d8d4",
            }}
          />
        </div>
        <div className="path-connector-line" style={{ height: "40px" }} />
        <div className="path-node">
          <div className="path-dot target">TGT</div>
          <div
            style={{
              width: 110,
              height: 13,
              borderRadius: 2,
              background: "#e0d8d4",
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          borderLeft: "1px solid #f0e8e4",
          paddingLeft: "2.5rem",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#e0d8d4",
            marginBottom: "0.6rem",
          }}
        />
        <div
          style={{
            width: 130,
            height: 18,
            borderRadius: 2,
            background: "#e0d8d4",
            marginBottom: "0.4rem",
          }}
        />
        <div
          style={{
            width: 90,
            height: 13,
            borderRadius: 2,
            background: "#e0d8d4",
            marginBottom: "1.4rem",
          }}
        />
        <div
          style={{
            width: 70,
            height: 13,
            borderRadius: 2,
            background: "#e0d8d4",
          }}
        />
      </div>
    </div>
  );
}

import { useState } from 'react';
import { IntroRequestModal } from '@/features/intros';
import { WarmthScore } from '@/features/gemini';

export default function PathCard({ path, score = '...', loading = false }) {
  const [open, setOpen] = useState(false);

  if (loading || !path) {
    return <PathCardSkeleton />;
  }

  return (
    <div className="app-card" style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div className="path-chain" style={{ width: '320px', flexShrink: 0 }}>
        {/* You Node */}
        <div className="path-node">
          <div className="path-dot you">YOU</div>
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
          <div className="path-dot connector">CON</div>
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
          <div className="path-dot target">TGT</div>
          <div>
            <div className="path-node-label">{path.target.name}</div>
          </div>
        </div>
      </div>

      {/* Target Info Section (Right Side) */}
      <div style={{ flex: 1, borderLeft: '1px solid #f0e8e4', paddingLeft: '2.5rem' }}>
        <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          {path.target.isAnonymous
            ? <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.2rem' }}>🕵️</div>
            : path.target.pictureUrl
              ? <img src={path.target.pictureUrl} alt={path.target.name} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }} />
              : '👤'}
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--dark)', marginBottom: '0.25rem' }}>
          {path.target.name} {path.target.isAnonymous && <span style={{ fontSize: '0.7rem', color: '#6a994e', verticalAlign: 'middle', marginLeft: '4px' }}>(Anonymous)</span>}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#7a6f68', marginBottom: '1.25rem' }}>{path.target.role}</div>
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

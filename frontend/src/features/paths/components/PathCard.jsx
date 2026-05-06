import { useState } from 'react';
import { User, EyeOff } from 'lucide-react';
import { IntroRequestModal } from '@/features/intros';
import { WarmthScore } from '@/features/gemini';

export default function PathCard({ path, score = '...' }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-card path-card-body">
      <div className="path-chain path-chain-fixed">
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
        <div style={{ fontSize: '0.85rem', color: '#7a6f68', marginBottom: '1.25rem' }}>{path.target.role}</div>
        
        {path.target.linkedinUrl && (
          <div style={{ marginBottom: '1.25rem' }}>
            <a 
              href={path.target.linkedinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                color: '#0077b5', 
                fontSize: '0.8rem', 
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              <span style={{ fontSize: '1rem' }}>🔗</span> LinkedIn Profile
            </a>
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <WarmthScore score={score} />
        </div>
        <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.4rem' }} onClick={() => setOpen(true)}>
          Request Intro →
        </button>
      </div>
      {open && <IntroRequestModal path={path} onClose={() => setOpen(false)} />}
    </div>
  );
}

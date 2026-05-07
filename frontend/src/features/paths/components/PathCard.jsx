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
        
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {path.target.linkedinUrl && (
            <a 
              href={path.target.linkedinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              title="LinkedIn Profile"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                color: '#0077b5', 
                textDecoration: 'none',
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          )}
          {path.target.handshakeUrl && (
            <a 
              href={path.target.handshakeUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              title="Handshake Profile"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                color: '#ff3b30', 
                textDecoration: 'none',
              }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                background: '#ff3b30', 
                borderRadius: '3px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                fontFamily: 'sans-serif'
              }}>h</div>
            </a>
          )}
        </div>

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

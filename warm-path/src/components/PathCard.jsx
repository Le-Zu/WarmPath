import { useState } from 'react';
import IntroRequestModal from './IntroRequestModal.jsx';
import WarmthScore from './WarmthScore.jsx'

export default function PathCard({ path, score = '...' }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-card" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div className="path-chain">
        <div className="path-node">
          <div className="path-dot you">YOU</div>
          <div><div className="path-node-label">You</div></div>
        </div>
        <div className="path-connector-line" />
        <div className="path-node">
          <div className="path-dot connector">CON</div>
          <div>
            <div className="path-node-label">{path.connector.name}</div>
            <div className="path-node-sub">{path.connector.relation}</div>
          </div>
        </div>
        <div className="path-connector-line" />
        <div className="path-node">
          <div className="path-dot target">TGT</div>
          <div>
            <div className="path-node-label">{path.target.name}</div>
            <div className="path-node-sub">{path.target.role}</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, paddingTop: '0.25rem' }}>
        <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          {path.target.pictureUrl
            ? <img src={path.target.pictureUrl} alt={path.target.name} style={{ width: '2rem', height: '2rem', borderRadius: '50%' }} />
            : '👤'}
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--dark)', marginBottom: '0.25rem' }}>{path.target.name}</div>
        <div style={{ fontSize: '0.82rem', color: '#7a6f68', marginBottom: '1rem' }}>{path.target.role}</div>
        <div style={{ marginBottom: '1rem' }}>
          <WarmthScore score={score} />
        </div>
        <button className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }} onClick={() => setOpen(true)}>
          Request Intro →
        </button>
      </div>
      {open && <IntroRequestModal path={path} onClose={() => setOpen(false)} />}
    </div>
  );
}

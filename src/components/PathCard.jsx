import { useState } from 'react';
import IntroRequestModal from './IntroRequestModal.jsx';
export default function PathCard({ path }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <div className="path-chain">
        <div className="path-node">
          <div className="path-dot you">YOU</div>
          <div><div className="path-node-label">You</div></div>
        </div>
        <div className="path-line" />
        <div className="path-node">
          <div className="path-dot connector">CON</div>
          <div>
            <div className="path-node-label">{path.connector.name}</div>
            <div className="path-node-sub">{path.connector.relation}</div>
          </div>
        </div>
        <div className="path-line" />
        <div className="path-node">
          <div className="path-dot target">TGT</div>
          <div>
            <div className="path-node-label">{path.target.name}</div>
            <div className="path-node-sub">{path.target.role}</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, paddingTop: '0.25rem' }}>
        <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{path.target.avatar}</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--dark)', marginBottom: '0.25rem' }}>{path.target.name}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>{path.target.role}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--mid)', fontWeight: 500, marginBottom: '1rem' }}>{path.strength}% connection strength</div>
        <button className="btn-primary btn-sm" onClick={() => setOpen(true)}>Request Intro →</button>
      </div>
      {open && <IntroRequestModal path={path} onClose={() => setOpen(false)} />}
    </div>
  );
}

import { useState } from 'react';
import IntroRequestModal from './IntroRequestModal.jsx';
export default function PathCard({ path }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card path-card-layout">
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
      <div className="path-card-info">
        <div className="path-card-avatar">{path.target.avatar}</div>
        <div className="path-card-name">{path.target.name}</div>
        <div className="path-card-role">{path.target.role}</div>
        <div className="path-card-strength">{path.strength}% connection strength</div>
        <button className="btn-primary btn-sm" onClick={() => setOpen(true)}>Request Intro →</button>
      </div>
      {open && <IntroRequestModal path={path} onClose={() => setOpen(false)} />}
    </div>
  );
}

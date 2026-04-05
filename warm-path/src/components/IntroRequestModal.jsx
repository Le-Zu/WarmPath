import { useState } from 'react';
export default function IntroRequestModal({ path, onClose }) {
  const [msg, setMsg] = useState(`Hi ${path.connector.name}, I'd love an intro to ${path.target.name}. Could you help make that connection?`);
  const [sent, setSent] = useState(false);
  if (sent) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--dark)', marginBottom: '0.5rem' }}>Request Sent</div>
        <div style={{ fontSize: '0.85rem', color: '#7a6f68', marginBottom: '1.5rem' }}>
          {path.connector.name} will be notified and can accept or decline.
        </div>
        <button className="btn-primary" onClick={onClose}>Done</button>
      </div>
    </div>
  );
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="app-eyebrow">Intro Request</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--dark)', marginBottom: '1rem' }}>
          Ask {path.connector.name} to introduce you to {path.target.name}
        </div>
        <textarea rows={5} value={msg} onChange={e => setMsg(e.target.value)} style={{ marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => setSent(true)}>Send Request</button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
export default function IntroRequestModal({ path, onClose }) {
  const [msg, setMsg] = useState(`Hi ${path.connector.name}, I'd love an intro to ${path.target.name}. Could you help make that connection?`);
  const [sent, setSent] = useState(false);
  if (sent) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
        <div className="modal-title">Request Sent</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          {path.connector.name} will be notified and can accept or decline.
        </p>
        <button className="btn-primary" onClick={onClose}>Done</button>
      </div>
    </div>
  );
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="page-eyebrow">Intro Request</div>
        <div className="modal-title">Ask {path.connector.name} to introduce you to {path.target.name}</div>
        <div className="edit-area" style={{ marginTop: '1rem' }}>
          <textarea rows={5} value={msg} onChange={e => setMsg(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => setSent(true)}>Send Request</button>
        </div>
      </div>
    </div>
  );
}

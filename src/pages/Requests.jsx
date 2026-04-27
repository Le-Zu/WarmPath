import { useState } from 'react';
import { mockRequests } from '../data/mockData.js';

function EditModal({ request, onSave, onClose }) {
  const [msg, setMsg] = useState(request.message);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="page-eyebrow">Edit intro message</div>
        <div className="modal-title">
          {request.from.name} → {request.to.name}
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          As the connector, you can refine this message before it's sent.
        </p>
        <div className="edit-area">
          <label>Message</label>
          <textarea
            rows={5}
            value={msg}
            onChange={e => setMsg(e.target.value)}
          />
          <div className="edit-hint">{msg.length} / 500 characters</div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(msg)}>Save & Approve</button>
        </div>
      </div>
    </div>
  );
}

function DeclineModal({ request, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="page-eyebrow">Decline request</div>
        <div className="modal-title">
          Decline intro for {request.from.name}?
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          The requester won't see your reason — this is just for your records.
        </p>
        <div className="edit-area">
          <label>Reason (optional)</label>
          <textarea
            rows={3}
            placeholder="e.g. I don't know this person well enough to vouch for them..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            style={{ background: '#c0392b' }}
            onClick={() => onConfirm(reason)}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Requests() {
  const [reqs, setReqs] = useState(mockRequests);
  const [editTarget, setEditTarget] = useState(null);
  const [declineTarget, setDeclineTarget] = useState(null);

  const approve = (id) =>
    setReqs(r => r.map(x => x.id === id ? { ...x, status: 'approved' } : x));

  const saveEdit = (id, msg) => {
    setReqs(r => r.map(x => x.id === id ? { ...x, message: msg, status: 'approved' } : x));
    setEditTarget(null);
  };

  const decline = (id) => {
    setReqs(r => r.map(x => x.id === id ? { ...x, status: 'declined' } : x));
    setDeclineTarget(null);
  };

  return (
    <div className="page">
      <div className="page-eyebrow">— Connector inbox</div>
      <div className="page-title">Intro Requests</div>
      <div className="page-sub">
        People asking you to make an introduction on their behalf. You control every intro.
      </div>

      {reqs.map(r => (
        <div key={r.id} className="request-card">
          <div className="request-header">
            <div>
              <div className="request-names">{r.from.name} → {r.to.name}</div>
              <div className="request-intent">Re: {r.intent} · {r.from.major}</div>
            </div>
            <span className={`tag tag-${r.status}`}>{r.status}</span>
          </div>

          <div className="request-message">"{r.message}"</div>

          {r.status === 'pending' && (
            <div className="request-actions">
              <button
                className="btn-primary btn-sm"
                onClick={() => approve(r.id)}
              >
                ✓ Approve
              </button>
              <button
                className="btn-secondary btn-sm"
                onClick={() => setEditTarget(r)}
              >
                ✎ Edit & Approve
              </button>
              <button
                className="btn-ghost btn-sm"
                style={{ color: '#c0392b', borderColor: '#c0392b' }}
                onClick={() => setDeclineTarget(r)}
              >
                ✕ Decline
              </button>
            </div>
          )}

          {r.status === 'approved' && (
            <div className="request-done">
              <span style={{ color: 'var(--mid)' }}>✓</span>
              You approved this intro — a chat room has been created.
            </div>
          )}

          {r.status === 'declined' && (
            <div className="request-done">
              <span style={{ color: '#c0392b' }}>✕</span>
              You declined this request.
            </div>
          )}
        </div>
      ))}

      {editTarget && (
        <EditModal
          request={editTarget}
          onSave={(msg) => saveEdit(editTarget.id, msg)}
          onClose={() => setEditTarget(null)}
        />
      )}

      {declineTarget && (
        <DeclineModal
          request={declineTarget}
          onConfirm={() => decline(declineTarget.id)}
          onClose={() => setDeclineTarget(null)}
        />
      )}
    </div>
  );
}

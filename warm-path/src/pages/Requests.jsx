import { useState, useEffect } from 'react';
import apiFetch from '../api/client.js';

export default function Requests() {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/requests/incoming')
      .then(({ requests }) => setReqs(requests))
      .catch((err) => {
        console.error('[Requests] Failed to fetch incoming requests:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const act = (id, status) => {
    apiFetch(`/api/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      .then(() => setReqs(r => r.map(x => x.id === id ? { ...x, status } : x)))
      .catch((err) => console.error(`[Requests] Failed to update request ${id}:`, err));
  };

  if (loading) return <div className="app-page">Loading inbox...</div>;
  if (error)   return <div className="app-page">Failed to load requests.</div>;

  return (
    <div className="app-page">
      <div className="app-eyebrow">— Connector inbox</div>
      <div className="app-page-title">Intro Requests</div>
      <div className="app-page-sub">People asking you to make an introduction on their behalf.</div>
      {reqs.length === 0 && (
        <div style={{ color: '#7a6f68', fontSize: '0.88rem', marginTop: '0.5rem' }}>
          Your connector inbox is empty. When someone asks you to make an introduction, it will appear here.
        </div>
      )}
      {reqs.map(r => (
        <div key={r.id} className="app-card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--dark)' }}>{r.from.name} → {r.to.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#7a6f68', marginTop: '2px' }}>Re: {r.intent}</div>
            </div>
            <span className={`tag tag-${r.status}`}>{r.status}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#5a5550', fontStyle: 'italic', marginBottom: '1rem', padding: '0.75rem', background: 'var(--cream)', borderRadius: 2 }}>
            "{r.message}"
          </div>
          {r.status === 'pending' && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }} onClick={() => act(r.id, 'approved')}>Accept</button>
              <button className="btn-ghost" style={{ fontSize: '0.82rem' }} onClick={() => act(r.id, 'declined')}>Decline</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

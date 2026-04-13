import { useState, useEffect } from 'react';
import apiFetch from '../api/client.js';

const tabs = ['all', 'pending', 'approved', 'declined'];

// Formats an ISO date string as a relative time label
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    apiFetch('/api/requests/outgoing')
      .then(({ requests }) => setRequests(requests))
      .catch((err) => {
        console.error('[MyRequests] Failed to fetch requests:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="app-page">Loading requests...</div>;
  if (error)   return <div className="app-page">Failed to load requests.</div>;

  const filtered = tab === 'all' ? requests : requests.filter(r => r.status === tab);

  return (
    <div className="app-page">
      <div className="app-eyebrow">— Track your requests</div>
      <div className="app-page-title">My Requests</div>
      <div className="app-page-sub">Intros you've requested and their current status.</div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '0.35rem 0.85rem', borderRadius: 2, border: '1.5px solid', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 400, background: tab === t ? 'var(--dark)' : 'transparent', color: tab === t ? 'var(--cream)' : 'var(--dark)', borderColor: 'var(--dark)', transition: 'all 0.15s' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ color: '#7a6f68', fontSize: '0.88rem', marginTop: '0.5rem' }}>
          {requests.length === 0
            ? "You haven't sent any intro requests yet. Find warm paths to get started."
            : `No ${tab} requests.`}
        </div>
      )}
      {filtered.map(r => (
        <div key={r.id} className="app-card" style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--dark)', marginBottom: '0.2rem' }}>{r.target.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#7a6f68' }}>{r.target.role} · via {r.connector.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '0.25rem' }}>{timeAgo(r.sentAt)}</div>
          </div>
          <span className={`tag tag-${r.status}`}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}

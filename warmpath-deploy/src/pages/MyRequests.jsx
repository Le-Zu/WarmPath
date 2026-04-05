import { mockMyRequests } from '../data/mockData.js';
const tabs = ['all', 'pending', 'approved', 'declined'];
import { useState } from 'react';
export default function MyRequests() {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? mockMyRequests : mockMyRequests.filter(r => r.status === tab);
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
      {filtered.map(r => (
        <div key={r.id} className="app-card" style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--dark)', marginBottom: '0.2rem' }}>{r.target.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#7a6f68' }}>{r.target.role} · via {r.connector.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '0.25rem' }}>{r.sentAt}</div>
          </div>
          <span className={`tag tag-${r.status}`}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}

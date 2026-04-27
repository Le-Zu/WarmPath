import { useState } from 'react';
import { mockMyRequests } from '../data/mockData.js';
const tabs = ['all', 'pending', 'approved', 'declined'];
export default function MyRequests() {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? mockMyRequests : mockMyRequests.filter(r => r.status === tab);
  return (
    <div className="page">
      <div className="page-eyebrow">— Track your requests</div>
      <div className="page-title">My Requests</div>
      <div className="page-sub">Intros you've requested and their current status.</div>
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t} className={'tab-btn' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {filtered.map(r => (
        <div key={r.id} className="card">
          <div className="my-request-row">
            <div>
              <div className="my-request-title">{r.target.name}</div>
              <div className="my-request-sub">{r.target.role} · via {r.connector.name}</div>
              <div className="my-request-time">{r.sentAt}</div>
            </div>
            <span className={`tag tag-${r.status}`}>{r.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import MessageDiff from '@/components/MessageDiff';
import { timeAgo } from '@/utils/formatters';
import { useOutgoingRequests } from '@/hooks/useOutgoingRequests';
import LoadingScreen from '@/components/LoadingScreen';

const tabs = ['all', 'pending', 'approved', 'declined'];

export default function MyRequests() {
  const { requests, loading, error } = useOutgoingRequests();
  const [tab, setTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  if (loading) return <LoadingScreen page="myRequests" />;
  if (error)   return <div className="app-page">Failed to load requests.</div>;

  const filtered = tab === 'all' ? requests : requests.filter(r => r.status === tab);

  return (
    <div className="app-page">
      <div className="app-eyebrow">— Track your requests —</div>
      <div className="app-page-title">My Requests</div>
      <div className="app-page-sub">Intros you've requested.</div>
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
            ? "No requests yet. Find a path and send your first intro."
            : `No ${tab} requests.`}
        </div>
      )}
      {filtered.map(r => (
        <div 
          key={r.id} 
          className="app-card" 
          role="button"
          tabIndex={0}
          aria-expanded={expandedId === r.id}
          style={{ marginBottom: '0.85rem', cursor: 'pointer' }}
          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpandedId(expandedId === r.id ? null : r.id);
            }
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--dark)', marginBottom: '0.2rem' }}>{r.target.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#7a6f68' }}>{r.target.role} · via {r.connector.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '0.25rem' }}>{timeAgo(r.sentAt)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <span className={`tag tag-${r.status}`}>{r.status}</span>
               <span style={{ color: '#7a6f68', display: 'inline-flex' }}>{expandedId === r.id ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}</span>
            </div>
          </div>
          
          {expandedId === r.id && (
            /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
            <div 
              style={{ 
                marginTop: '1.25rem', 
                paddingTop: '1rem', 
                borderTop: '1px solid #f2e9e4',
                cursor: 'default'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div className="app-eyebrow" style={{ fontSize: '0.65rem', marginBottom: 0 }}>Message to {r.target.name.split(' ')[0]}</div>
                {r.edited_message && r.edited_message !== r.draft_message && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--warm)', fontWeight: 500 }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warm)', marginRight: '4px' }}></span>
                    Connector edited the original draft
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#5a5550', background: 'var(--cream)', padding: '1rem', borderRadius: '4px' }}>
                <MessageDiff original={r.draft_message} edited={r.edited_message || r.draft_message} />
              </div>

              {r.connector_note && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="app-eyebrow" style={{ fontSize: '0.65rem', marginBottom: '0.35rem' }}>Connector's Private Note</div>
                  <div style={{ 
                    fontSize: '0.88rem', 
                    color: '#5a5550', 
                    background: 'rgba(216, 140, 154, 0.05)', 
                    padding: '0.85rem', 
                    borderRadius: '4px',
                    borderLeft: '3px solid var(--warm)',
                    fontStyle: 'italic'
                  }}>
                    "{r.connector_note}"
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

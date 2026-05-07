import { useState } from 'react';
import MessageDiff from '@/components/MessageDiff';
import { useIncomingRequests } from '@/hooks/useIncomingRequests';
import { useToast } from '@/context/ToastContext';
import LoadingScreen from '@/components/LoadingScreen';

function RequestCard({ r, onUpdate, patchRequest }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editedMsg, setEditedMsg] = useState(r.message);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);

  const act = async (status) => {
    setActing(true);
    try {
      const body = { status };
      if (status === 'approved' && editedMsg !== r.message) {
        body.edited_message = editedMsg;
      }
      if (note) {
        body.connector_note = note;
      }

      await patchRequest(r.id, body);
      onUpdate(r.id, status);
    } catch (err) {
      console.error(`[Requests] Failed to update request ${r.id}:`, err);
      toast('Failed to update request: ' + err.message, 'error');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="app-card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--dark)' }}>{r.from.name} → {r.to.name}</div>
          <div style={{ fontSize: '0.78rem', color: '#7a6f68', marginTop: '2px' }}>{r.from.role} • Re: {r.intent}</div>
        </div>
        <span className={`tag tag-${r.status}`}>{r.status}</span>
      </div>

      {r.message_to_connector && (
        <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#eef3ef', borderLeft: '3px solid var(--dark)', borderRadius: '2px' }}>
          <div className="app-eyebrow" style={{ fontSize: '0.6rem', marginBottom: '0.35rem', color: 'var(--dark)' }}>Private Note to You</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--dark)', fontStyle: 'italic', lineHeight: 1.4 }}>
            "{r.message_to_connector}"
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <div className="app-eyebrow" style={{ fontSize: '0.65rem', marginBottom: 0 }}>Proposed Message</div>
          {r.status === 'pending' && (
            <button 
              onClick={() => setEditing(!editing)}
              style={{ background: 'none', border: 'none', color: 'var(--warm)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}
            >
              {editing ? 'Cancel Edit' : 'Edit Message'}
            </button>
          )}
        </div>
        
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <textarea 
              value={editedMsg}
              onChange={(e) => setEditedMsg(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.75rem', background: '#fff', height: '100px' }}
            />
            {editedMsg !== r.draft_message && (
               <div style={{ fontSize: '0.82rem', padding: '0.75rem', background: '#fcfaf9', border: '1px dashed #e8ddd8', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#9b8880', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Preview with highlights</div>
                  <MessageDiff original={r.draft_message} edited={editedMsg} />
               </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: '#5a5550', padding: '0.75rem', background: 'var(--cream)', borderRadius: 2 }}>
            <MessageDiff original={r.draft_message} edited={r.edited_message || r.draft_message} />
          </div>
        )}
      </div>

      {r.status === 'pending' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <div className="app-eyebrow" style={{ fontSize: '0.65rem', marginBottom: '0.35rem' }}>Add a note (optional)</div>
            <textarea 
              placeholder="e.g. 'I'll forward this tomorrow' or decline reason..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.5rem', height: '60px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn-primary" 
              style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }} 
              disabled={acting}
              onClick={() => act('approved')}
            >
              {acting ? '...' : 'Approve & Forward'}
            </button>
            <button 
              className="btn-ghost" 
              style={{ fontSize: '0.82rem' }} 
              disabled={acting}
              onClick={() => act('declined')}
            >
              Decline
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Requests() {
  const { requests, loading, error, updateRequestStatus, patchRequest } = useIncomingRequests();

  if (loading) return <LoadingScreen page="requests" />;
  if (error)   return <div className="app-page">Failed to load requests.</div>;

  return (
    <div className="app-page">
      <div className="app-eyebrow">— Connector inbox</div>
      <div className="app-page-title">Intro Requests</div>
      <div className="app-page-sub">People asking you to make an introduction on their behalf.</div>
      {requests.length === 0 && (
        <div style={{ color: '#7a6f68', fontSize: '0.88rem', marginTop: '0.5rem' }}>
          Your connector inbox is empty. When someone asks you to make an introduction, it will appear here.
        </div>
      )}
      {requests.map(r => (
        <RequestCard key={r.id} r={r} onUpdate={updateRequestStatus} patchRequest={patchRequest} />
      ))}
    </div>
  );
}

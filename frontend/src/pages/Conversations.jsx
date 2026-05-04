import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/useConversations';

export default function Conversations() {
  const { conversations, loading, error } = useConversations();
  const navigate = useNavigate();

  if (loading) return <div className="app-page">Loading conversations...</div>;
  if (error) return <div className="app-page">Failed to load conversations.</div>;

  return (
    <div className="app-page">
      <div className="app-eyebrow">— Your active chats</div>
      <div className="app-page-title">Conversations</div>
      <div className="app-page-sub">Direct communication with your connections.</div>

      <div style={{ marginTop: '2rem' }}>
        {conversations.length === 0 ? (
          <div style={{ color: '#7a6f68', fontStyle: 'italic' }}>No active conversations yet.</div>
        ) : (
          conversations.map((conv) => (
            <div 
              key={conv.conversation_id} 
              className="app-card" 
              style={{ marginBottom: '1rem', cursor: 'pointer' }}
              onClick={() => navigate(`/chat/${conv.conversation_id}`)}
            >
              <div style={{ fontWeight: 600, color: 'var(--dark)' }}>
                {conv.participants
                  .filter(p => p.user.user_id !== conv.current_user_id) // We'll need to handle current_user_id
                  .map(p => `${p.user.first_name} ${p.user.last_name}`)
                  .join(', ')}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#7a6f68' }}>
                Type: {conv.type} | Started {new Date(conv.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

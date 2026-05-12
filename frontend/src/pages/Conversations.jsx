import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/useConversations';
import { useUser } from '@/context/UserContext';
import LoadingScreen from '@/components/LoadingScreen';

export default function Conversations() {
  const { conversations, loading, error } = useConversations();
  const { currentUser } = useUser();
  const navigate = useNavigate();

  if (loading) return <LoadingScreen page="chats" />;
  if (error) return <div className="app-page">Failed to load conversations.</div>;

  return (
    <div className="app-page">
      <div className="app-eyebrow">— Your active chats —</div>
      <div className="app-page-title">Conversations</div>
      <div className="app-page-sub">Direct communication with your connections.</div>

      <div style={{ marginTop: '2rem' }}>
        {conversations.length === 0 ? (
          <div style={{ color: '#7a6f68', fontStyle: 'italic' }}>Conversations start once a connector approves an intro request. Yours will show up here.</div>
        ) : (
          conversations.map((conv) => {
            const myRole = conv.participants.find(p => p.user_id === currentUser?.user_id)?.role;
            const otherParticipants = conv.participants.filter(p => p.user_id !== currentUser?.user_id);
            
            let badgeText = "";
            let badgeColor = "";
            
            if (myRole === 'requester') {
              badgeText = "You requested";
              badgeColor = "rgba(0, 122, 255, 0.1)"; // Light blue
            } else if (myRole === 'connector') {
              badgeText = "Connector";
              badgeColor = "rgba(52, 199, 89, 0.1)"; // Light green
            } else if (myRole === 'target') {
              badgeText = "New connection";
              badgeColor = "rgba(231, 111, 81, 0.1)"; // Warm/Orange
            }

            return (
              <div 
                key={conv.conversation_id} 
                className="app-card" 
                style={{ 
                  marginBottom: '1rem', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem'
                }}
                onClick={() => navigate(`/chat/${conv.conversation_id}`)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '1rem' }}>
                      {otherParticipants.map(p => `${p.user.first_name} ${p.user.last_name}`).join(', ')}
                    </div>
                    {badgeText && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        background: badgeColor,
                        color: 'var(--dark)',
                        letterSpacing: '0.02em'
                      }}>
                        {badgeText}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7a6f68', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: conv.status === 'active' ? '#34c759' : '#ccc' 
                    }} />
                    {conv.type === 'chat' ? 'In-app Chat' : 'Email Thread'} • Started {new Date(conv.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ color: 'var(--warm)', fontSize: '1.25rem' }}>→</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


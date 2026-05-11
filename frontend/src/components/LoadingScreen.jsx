import { Loader2, Flame, Inbox, Send, MessageSquare, User } from 'lucide-react';

const PAGE_CONFIGS = {
  paths: {
    icon: Flame,
    title: 'Finding your paths',
    subtext: "Looking for the warmest routes through your network..."
  },
  requests: {
    icon: Inbox,
    title: 'Loading intro requests',
    subtext: "Checking what's waiting for you..."
  },
  myRequests: {
    icon: Send,
    title: 'Pulling up your requests',
    subtext: "Gathering the intros you've sent..."
  },
  chats: {
    icon: MessageSquare,
    title: 'Opening your conversations',
    subtext: 'Setting up your coffee chats...'
  },
  profile: {
    icon: User,
    title: 'Loading your profile',
    subtext: 'Pulling together your story...'
  },
  default: {
    icon: Loader2,
    title: 'Loading',
    subtext: 'Just a moment...'
  }
};

export default function LoadingScreen({ page = 'default' }) {
  const config = PAGE_CONFIGS[page] || PAGE_CONFIGS.default;
  const Icon = config.icon;

  return (
    <div className="app-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      textAlign: 'center',
      animation: 'wp-fade-in 0.5s ease-out'
    }}>
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '2px solid var(--warm)',
          borderTopColor: 'transparent',
          animation: 'wp-spin 1.2s linear infinite'
        }} />
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(231, 111, 81, 0.08)',
          color: 'var(--warm)'
        }}>
          <Icon size={32} style={{ 
            animation: page === 'paths' ? 'wp-pulse 1.5s ease-in-out infinite' : 'none' 
          }} />
        </div>
      </div>
      
      <h2 style={{ 
        fontFamily: 'var(--font-serif)', 
        fontSize: '1.5rem', 
        color: 'var(--dark)',
        marginBottom: '0.5rem'
      }}>
        {config.title}
      </h2>
      <p style={{ 
        fontSize: '0.9rem', 
        color: '#7a6f68',
        maxWidth: '280px',
        lineHeight: 1.5
      }}>
        {config.subtext}
      </p>

      <style>{`
        @keyframes wp-spin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes wp-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes wp-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

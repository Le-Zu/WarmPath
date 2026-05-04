import { useState, useEffect } from 'react';
import { getNotifications, markRead } from '@/services/notifications';

const TYPE_MAP = {
  'intro_request': { title: 'New intro request', body: 'Someone wants you to connect them.' },
  'request_approved': { title: 'Intro approved', body: 'Your request has been approved!' },
  'request_declined': { title: 'Intro declined', body: 'Your request was declined.' },
  'new_message': { title: 'New message', body: 'You have a new message in a conversation.' },
  'connector_prompt': { title: 'Path found', body: 'You might be able to help someone meet a target.' },
  'connection_accepted': { title: 'Connection accepted', body: 'Someone accepted your connection request.' },
};

export default function NotificationBell({ light }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotes();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifications(prev => prev.map(n => 
        n.notification_id === id ? { ...n, is_read: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="bell-wrap">
      <button className="bell-btn" onClick={() => setOpen(o => !o)}
        style={{ color: light ? '#5a5550' : 'rgba(242,233,228,0.8)' }}>🔔</button>
      {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      {open && (
        <div className="bell-dropdown">
          {notifications.length === 0 ? (
            <div className="bell-item" style={{ textAlign: 'center', opacity: 0.6 }}>No notifications</div>
          ) : (
            notifications.map((n) => {
              const info = TYPE_MAP[n.type] || { title: 'Notification', body: 'You have an update.' };
              return (
                <div key={n.notification_id} 
                     className={`bell-item ${n.is_read ? 'read' : 'unread'}`}
                     onClick={() => !n.is_read && handleMarkRead(n.notification_id)}>
                  <div className="bell-item-title">{info.title}</div>
                  <div className="bell-item-body">{info.body}</div>
                  {!n.is_read && <div className="unread-dot" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

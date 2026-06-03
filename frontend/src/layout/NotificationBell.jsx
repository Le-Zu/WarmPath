import { useState, useEffect, useRef, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications, markRead } from '@/services/notifications';

const TYPE_MAP = {
  'intro_request': { title: 'New intro request', body: 'Someone wants you to connect them.', groupTitle: 'intro requests' },
  'request_approved': { title: 'Intro approved', body: 'Your request has been approved!', groupTitle: 'approved requests' },
  'request_declined': { title: 'Intro declined', body: 'Your request was declined.', groupTitle: 'declined requests' },
  'new_message': { title: 'New message', body: 'You have a new message in a conversation.', groupTitle: 'new messages' },
  'connector_prompt': { title: 'Path found', body: 'You might be able to help someone meet a target.', groupTitle: 'path prompts' },
  'connection_accepted': { title: 'Connection accepted', body: 'Someone accepted your connection request.', groupTitle: 'accepted connections' },
};

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? 's' : ''} ago`;
}

export default function NotificationBell({ light }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await getNotifications();
        const sorted = (data.notifications || []).sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        setNotifications(sorted);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotes();
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

  const displayItems = useMemo(() => {
    const items = [];
    const readGroups = {};

    notifications.forEach((n) => {
      if (!n.is_read) {
        items.push({ ...n, isGroup: false });
      } else {
        if (!readGroups[n.type]) {
          readGroups[n.type] = {
            isGroup: true,
            type: n.type,
            count: 0,
            latestDate: n.created_at,
            ids: []
          };
        }
        readGroups[n.type].count++;
        readGroups[n.type].ids.push(n.notification_id);
        if (new Date(n.created_at) > new Date(readGroups[n.type].latestDate)) {
          readGroups[n.type].latestDate = n.created_at;
        }
      }
    });

    Object.values(readGroups).forEach((group) => {
      if (group.count === 1) {
        const original = notifications.find(n => n.notification_id === group.ids[0]);
        items.push({ ...original, isGroup: false });
      } else {
        items.push(group);
      }
    });

    items.sort((a, b) => {
      const dateA = new Date(a.isGroup ? a.latestDate : a.created_at).getTime();
      const dateB = new Date(b.isGroup ? b.latestDate : b.created_at).getTime();
      return dateB - dateA;
    });

    return items;
  }, [notifications]);

  const visibleItems = displayItems.slice(0, visibleCount);
  const hasMore = visibleCount < displayItems.length;

  return (
    <div className="bell-wrap" ref={bellRef}>
      <button className="bell-btn" onClick={() => setOpen(o => !o)}
        style={{ color: light ? '#5a5550' : 'rgba(242,233,228,0.8)', display: 'inline-flex', alignItems: 'center' }}>
        <Bell size={20} strokeWidth={2} />
      </button>
      {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      {open && (
        <div className="bell-dropdown" style={{ zIndex: 9999, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
          <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #f0e8e4', fontWeight: 600, fontSize: '0.9rem', color: 'var(--charcoal)', background: '#fff' }}>
            Notifications
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {displayItems.length === 0 ? (
              <div className="bell-item" style={{ textAlign: 'center', opacity: 0.6, padding: '2rem 1rem' }}>You're all caught up.</div>
            ) : (
              visibleItems.map((item, idx) => {
                const info = TYPE_MAP[item.type] || { title: 'Notification', body: 'You have an update.', groupTitle: 'updates' };
                
                if (item.isGroup) {
                  return (
                    <div key={`group-${item.type}`} className="bell-item read">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                        <div className="bell-item-title">{item.count} past {info.groupTitle}</div>
                        <span style={{ fontSize: '0.7rem', color: '#a09792', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                          {formatTimeAgo(item.latestDate)}
                        </span>
                      </div>
                      <div className="bell-item-body">You have already seen these updates.</div>
                    </div>
                  );
                }

                return (
                  <div key={item.notification_id} 
                       className={`bell-item ${item.is_read ? 'read' : 'unread'}`}
                       role="button"
                       tabIndex={0}
                       onClick={() => !item.is_read && handleMarkRead(item.notification_id)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' || e.key === ' ') {
                           e.preventDefault();
                           if (!item.is_read) handleMarkRead(item.notification_id);
                         }
                       }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                      <div className="bell-item-title">{info.title}</div>
                      <span style={{ fontSize: '0.7rem', color: '#a09792', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                    <div className="bell-item-body">{info.body}</div>
                    {!item.is_read && <div className="unread-dot" style={{ top: '50%', transform: 'translateY(-50%)' }} />}
                  </div>
                );
              })
            )}
          </div>
          {hasMore && (
            <div style={{ padding: '0.5rem', background: '#fcfaf9', borderTop: '1px solid #f0e8e4', textAlign: 'center' }}>
              <button 
                onClick={() => setVisibleCount(c => c + 6)}
                style={{ background: 'none', border: 'none', color: 'var(--warm)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', padding: '0.4rem 1rem', borderRadius: '4px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,111,81,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                View More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

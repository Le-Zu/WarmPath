import { useState } from 'react';
export default function NotificationBell({ light }) {
  const [open, setOpen] = useState(false);
  const notes = [
    { title: 'Alex approved your intro', body: 'Your request to meet Sarah K. is moving forward.' },
    { title: 'New intro request', body: 'Jordan wants you to connect them with Prof. Lee.' },
    { title: 'Path found', body: '3 new connectors match your research goal.' },
    { title: 'Intro complete', body: 'Marcus and Priya have exchanged contact info.' },
  ];
  return (
    <div className="bell-wrap">
      <button className="bell-btn" onClick={() => setOpen(o => !o)}
        style={{ color: light ? '#5a5550' : 'rgba(242,233,228,0.8)' }}>🔔</button>
      {notes.length > 0 && <span className="bell-badge">{notes.length}</span>}
      {open && (
        <div className="bell-dropdown">
          {notes.map((n, i) => (
            <div key={i} className="bell-item">
              <div className="bell-item-title">{n.title}</div>
              <div className="bell-item-body">{n.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

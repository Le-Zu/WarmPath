import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { logoBase64 } from '../assets/logo.js';
import NotificationBell from './NotificationBell.jsx';
import UserSwitcher from './UserSwitcher.jsx';
import { useState } from 'react';

const intents = ['Internship', 'Research', 'Class Help', 'Club', 'Skill'];

export default function AppLayout() {
  const [activeIntent, setActiveIntent] = useState('Internship');
  const navigate = useNavigate();

  return (
    <>
      <nav className="nav-cream">
        <NavLink to="/home" className="nav-logo">
          <img src={logoBase64} alt="WarmPath" />
        </NavLink>
        <div className="nav-links">
          {[['Find Paths','/paths'],['Inbox','/requests'],['My Requests','/my-requests'],['Profile','/profile']].map(([label, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              {label}
            </NavLink>
          ))}
        </div>
        <div className="nav-right">
          <NotificationBell />
          <UserSwitcher />
        </div>
      </nav>

      <div className="intent-bar">
        <span className="intent-bar-label">What are you looking for?</span>
        {intents.map(intent => (
          <button
            key={intent}
            className={'intent-pill' + (activeIntent === intent ? ' active' : '')}
            onClick={() => { setActiveIntent(intent); navigate('/paths'); }}
          >
            {intent}
          </button>
        ))}
      </div>

      <Outlet />
    </>
  );
}

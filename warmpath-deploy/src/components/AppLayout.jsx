import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { logoBase64 } from '../assets/logo.js';
import NotificationBell from './NotificationBell.jsx';
import UserSwitcher from './UserSwitcher.jsx';
import { useState } from 'react';

const intents = ['Internship', 'Research', 'Class Help', 'Club', 'Skill'];
const links = [['Find Paths','/paths'],['Inbox','/requests'],['My Requests','/my-requests'],['Profile','/profile']];

export default function AppLayout() {
  const [activeIntent, setActiveIntent] = useState('Internship');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="nav-cream">
        <NavLink to="/home" className="nav-logo">
          <img src={logoBase64} alt="WarmPath" />
        </NavLink>

        {/* Desktop links */}
        <div className="nav-links">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              {label}
            </NavLink>
          ))}
        </div>

        <div className="nav-right">
          <NotificationBell />
          <UserSwitcher />
          {/* Mobile hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="nav-mobile-menu">
          {links.map(([label, to]) => (
            <NavLink
              key={to} to={to}
              className="nav-mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}

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

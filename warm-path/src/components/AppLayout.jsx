import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { logoBase64 } from '../assets/logo.js';
import NotificationBell from './NotificationBell.jsx';
import UserSwitcher from './UserSwitcher.jsx';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const DEV_EMAIL_DOMAIN = '@dev.warmpath.com';
const TEST_EMAIL_DOMAIN = '@test.warmpath.com';

const intents = ['Internship', 'Research', 'Class Help', 'Club', 'Skill'];

export default function AppLayout() {
  const [activeIntent, setActiveIntent] = useState('Internship');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isDevAccount = currentUser?.email?.endsWith(DEV_EMAIL_DOMAIN) ?? false;
  const isTestAccount = currentUser?.email?.endsWith(TEST_EMAIL_DOMAIN) ?? false;
  return (
    <>
      {/* Cream top navbar */}
      <nav style={{
        background: '#f2e9e4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        height: '68px',
        borderBottom: '1px solid #e8ddd8',
      }}>
        <NavLink to="/home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={logoBase64} alt="WarmPath" style={{ height: '46px', width: 'auto' }} />
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {[['Find Paths','/paths'],['Inbox','/requests'],['My Requests','/my-requests'],['Profile','/profile']].map(([label, to]) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 400,
              color: isActive ? '#e76f51' : '#5a5550',
              textDecoration: 'none', letterSpacing: '0.01em', transition: 'color 0.15s',
            })}>{label}</NavLink>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <NotificationBell light />
          {isDevAccount && <UserSwitcher light />}
        </div>
      </nav>

      {/* Dark green intent filter bar */}
      <div style={{
        background: '#386641',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '0 2rem',
        height: '48px',
      }}>
        <span style={{ color: 'rgba(242,233,228,0.75)', fontSize: '0.82rem', fontFamily: 'var(--font-sans)', marginRight: '0.5rem' }}>
          What are you looking for?
        </span>
        {intents.map(intent => (
          <button key={intent} onClick={() => { setActiveIntent(intent); navigate('/paths'); }}
            style={{
              background: activeIntent === intent ? '#e76f51' : 'transparent',
              color: activeIntent === intent ? '#fff' : 'rgba(242,233,228,0.8)',
              border: `1.5px solid ${activeIntent === intent ? '#e76f51' : 'rgba(242,233,228,0.35)'}`,
              borderRadius: '999px', padding: '0.25rem 0.9rem',
              fontSize: '0.8rem', fontFamily: 'var(--font-sans)',
              fontWeight: activeIntent === intent ? 500 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {intent}
          </button>
        ))}
      </div>

      <Outlet />
    </>
  );
}

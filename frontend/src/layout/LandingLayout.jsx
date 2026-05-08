import { Outlet, useNavigate } from 'react-router-dom';
import { logoBase64 } from '../assets/logo.js';

export default function LandingLayout() {
  const nav = useNavigate();
  return (
    <>
      <nav style={{
        background: 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem', height: '68px',
        borderBottom: '1px solid #e8ddd8',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={logoBase64} alt="WarmPath" style={{ height: '42px', width: 'auto' }} />
        </a>
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
          <a href="#features"      style={lStyle}>Features</a>
          <a href="#how-it-works"  style={lStyle}>How It Works</a>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.4rem' }} onClick={() => nav('/home')}>
          Get Started
        </button>
      </nav>
      <Outlet />
    </>
  );
}

const lStyle = {
  fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 500,
  color: '#5a5550', textDecoration: 'none', letterSpacing: '0.06em',
  transition: 'color 0.15s',
};

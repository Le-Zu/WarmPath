import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { subscribe, isSlow } from '@/services/requestTracker';

// Full-screen overlay shown when the first API request takes long enough that
// the user might think the app is frozen. Tied to Render's ~50s cold-start.
export default function ColdStartOverlay() {
  const [slow, setSlow] = useState(isSlow());

  useEffect(() => subscribe(setSlow), []);

  if (!slow) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#f2e9e4',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'wp-coldstart-fade 0.4s ease-out',
      }}
    >
      <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '92px',
            height: '92px',
            borderRadius: '50%',
            border: '2px solid var(--warm)',
            borderTopColor: 'transparent',
            animation: 'wp-coldstart-spin 1.4s linear infinite',
          }}
        />
        <div
          style={{
            width: '92px',
            height: '92px',
            borderRadius: '50%',
            background: 'rgba(231, 111, 81, 0.08)',
            color: 'var(--warm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Flame size={36} style={{ animation: 'wp-coldstart-pulse 1.6s ease-in-out infinite' }} />
        </div>
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.6rem',
          color: 'var(--dark)',
          margin: 0,
          marginBottom: '0.5rem',
        }}
      >
        Warming up&hellip;
      </h2>
      <p
        style={{
          fontSize: '0.9rem',
          color: '#7a6f68',
          maxWidth: '320px',
          lineHeight: 1.5,
          textAlign: 'center',
          margin: 0,
        }}
      >
        First visit in a while &mdash; this can take up to a minute.
      </p>

      <style>{`
        @keyframes wp-coldstart-spin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes wp-coldstart-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes wp-coldstart-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

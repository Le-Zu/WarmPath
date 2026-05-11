import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

// Shown after a Connector is added via an email that isn't on WarmPath yet.
// The backend has created a ghost profile; we surface an invite link the
// inviter can share so the new person can claim the account and accept.
export default function InviteConnectorPanel({ peer, onDone }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const displayName =
    [peer.first_name, peer.last_name].filter(Boolean).join(' ') || peer.email;
  const inviteUrl = `${window.location.origin}/register?email=${encodeURIComponent(peer.email)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast(`Invite link copied for ${displayName}.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Could not copy link. Please copy it manually.', 'error');
    }
  };

  return (
    <div
      style={{
        padding: '1.25rem',
        background: '#fff',
        border: '1px dashed #d88c9a',
        borderRadius: '6px',
        textAlign: 'left',
      }}
    >
      <h3 style={{ fontSize: '1rem', color: 'var(--dark)', marginBottom: '0.4rem' }}>
        {displayName} isn&rsquo;t on WarmPath yet
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#7a6f68', lineHeight: 1.5, marginBottom: '0.9rem' }}>
        Share this invite link so they can join and accept your connection.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem' }}>
        <input
          type="text"
          readOnly
          value={inviteUrl}
          onFocus={(e) => e.target.select()}
          style={{
            flex: 1,
            padding: '0.55rem 0.7rem',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            background: '#f8f4f0',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            color: '#5d4d44',
            minWidth: 0,
          }}
        />
        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.55rem 0.9rem',
            borderRadius: '4px',
            border: 'none',
            background: copied ? 'var(--dark)' : 'LightSalmon',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      <button
        type="button"
        onClick={onDone}
        style={{
          background: 'transparent',
          border: '1px solid #7a6f68',
          color: '#7a6f68',
          padding: '0.5rem 1rem',
          borderRadius: '100px',
          fontWeight: 600,
          fontSize: '0.8rem',
          cursor: 'pointer',
        }}
      >
        Done
      </button>
    </div>
  );
}

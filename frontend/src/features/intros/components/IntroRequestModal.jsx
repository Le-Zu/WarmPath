import { useState, useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import apiFetch from '@/services/client';

export default function IntroRequestModal({ path, onClose }) {
  const [connectorNote, setConnectorNote] = useState(`Hi ${path.connector.name.split(' ')[0]}, I'd love an intro to ${path.target.name.split(' ')[0]}. Could you help make that connection?`);
  const [targetMessage, setTargetMessage] = useState(`Hi ${path.target.name.split(' ')[0]}, I saw your profile and would love to chat about your experience.`);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const previousFocusedElement = document.activeElement;

    // Trap focus inside modal
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!focusableElements || focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusedElement) {
        previousFocusedElement.focus();
      }
    };
  }, [onClose]);

  const sendRequest = () => {
    setLoading(true);
    setError(null);
    apiFetch('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
        connectorId: path.connector.id,
        targetId: path.target.id,
        message: targetMessage,
        messageToConnector: connectorNote,
      }),
    })
      .then(() => setSent(true))
      .catch((err) => {
        console.error('[IntroRequestModal] Failed to send request:', err);
        // 429 (rate limit) and 409 (pending/cooldown) come back from the
        // server with user-friendly text; fall back to a generic message.
        if (err.status === 429 || err.status === 409) {
          setError(err.message);
        } else {
          setError(err.message || 'Failed to send request. Please try again.');
        }
      })
      .finally(() => setLoading(false));
  };

  if (sent) return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        role="button"
        tabIndex={-1}
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
        aria-label="Close modal"
        style={{ position: 'absolute', inset: 0 }}
      />
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-sent-title"
        className="modal-box" 
        style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}
      >
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <CheckCircle2 size={48} strokeWidth={1.75} color="#6a994e" />
        </div>
        <div id="intro-sent-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--dark)', marginBottom: '0.5rem' }}>Request Sent</div>
        <div style={{ fontSize: '0.85rem', color: '#7a6f68', marginBottom: '1.5rem' }}>
          {path.connector.name} will be notified and can accept or decline.
        </div>
        <button className="btn-primary" onClick={onClose}>Done</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        role="button"
        tabIndex={-1}
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
        aria-label="Close modal"
        style={{ position: 'absolute', inset: 0 }}
      />
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-request-title"
        className="modal-box" 
        style={{ maxWidth: '520px', position: 'relative', zIndex: 1 }}
      >
        <div id="intro-request-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--dark)', marginBottom: '0.25rem' }}>Ask for an Introduction</div>
        <div style={{ fontSize: '0.85rem', color: '#7a6f68', marginBottom: '1.5rem' }}>
          We'll ask <strong>{path.connector.name}</strong> to introduce you to <strong>{path.target.name}</strong>.
        </div>

        {error && (
          <div style={{ color: '#c0392b', fontSize: '0.82rem', marginBottom: '1rem', padding: '0.5rem', background: '#fce4ec', borderRadius: '4px' }}>{error}</div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="connector-note" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--dark)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Note to {path.connector.name.split(' ')[0]} (Private)
          </label>
          <textarea 
            id="connector-note"
            rows={3} 
            value={connectorNote} 
            onChange={e => setConnectorNote(e.target.value)} 
            placeholder="e.g. Hi, I'm looking for roles at their company. Would you mind forwarding my message?"
            style={{ fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="target-message" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--dark)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Message for {path.target.name.split(' ')[0]}
          </label>
          <textarea 
            id="target-message"
            rows={5} 
            value={targetMessage} 
            onChange={e => setTargetMessage(e.target.value)} 
            placeholder="Write a message that will be shown to the contact..."
            style={{ fontSize: '0.85rem' }}
          />
          <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.4rem' }}>
            Tip: Keep it short and mention a specific reason you'd like to connect.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={sendRequest} disabled={loading}>
            {loading ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

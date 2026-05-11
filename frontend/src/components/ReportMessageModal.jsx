import { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import apiFetch from '@/services/client';
import { useToast } from '@/context/ToastContext';

const REASONS = [
  { id: 'harassment', label: 'Harassment or hateful behavior' },
  { id: 'spam', label: 'Spam or unwanted promotion' },
  { id: 'impersonation', label: 'Impersonation or fake identity' },
  { id: 'other', label: 'Something else' },
];

// Two-step modal: collect the report, submit, then offer to block the same
// user as the natural follow-up action.
export default function ReportMessageModal({ message, reportedUser, onClose, onBlock }) {
  const toast = useToast();
  const [reason, setReason] = useState('harassment');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const displayName =
    [reportedUser?.first_name, reportedUser?.last_name].filter(Boolean).join(' ') ||
    reportedUser?.email ||
    'this person';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          reported_id: reportedUser.user_id,
          message_id: message?.message_id || null,
          reason,
          notes: notes.trim() || null,
        }),
      });
      setSubmitted(true);
      toast('Report received. Thanks for letting us know.');
    } catch (err) {
      toast(`Could not file report: ${err.message || 'unknown error'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '0.6rem',
            right: '0.6rem',
            background: 'transparent',
            border: 'none',
            color: '#7a6f68',
            cursor: 'pointer',
            padding: '0.3rem',
            display: 'inline-flex',
          }}
        >
          <X size={18} />
        </button>

        {!submitted ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <ShieldAlert size={18} color="var(--warm)" />
              <h3 style={{ fontSize: '1.05rem', color: 'var(--dark)', margin: 0 }}>
                Report {displayName}
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#7a6f68', margin: '0.2rem 0 1.1rem' }}>
              Reports are sent to the WarmPath team and reviewed manually.
            </p>

            {message?.body && (
              <div
                style={{
                  background: '#f8f4f0',
                  borderLeft: '3px solid var(--warm)',
                  padding: '0.55rem 0.7rem',
                  fontSize: '0.82rem',
                  color: '#5a5550',
                  marginBottom: '1rem',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '5em',
                  overflow: 'hidden',
                }}
              >
                {message.body}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--dark)', marginBottom: '0.35rem' }}>
                Reason
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                {REASONS.map((r) => (
                  <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--dark)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    {r.label}
                  </label>
                ))}
              </div>

              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--dark)', marginBottom: '0.35rem' }}>
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
                rows={3}
                placeholder="Add any context that helps us understand what happened."
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: '1.1rem',
                }}
              />

              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    background: 'transparent',
                    border: '1px solid #7a6f68',
                    color: '#7a6f68',
                    padding: '0.5rem 1rem',
                    borderRadius: '100px',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'LightSalmon',
                    border: 'none',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '100px',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Sending…' : 'Send report'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--dark)', margin: 0, marginBottom: '0.3rem' }}>
              Report sent
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#7a6f68', lineHeight: 1.5, marginTop: 0, marginBottom: '1.1rem' }}>
              Would you also like to block {displayName}? Blocking hides them from your paths, prevents new intro requests in either direction, and closes the current chat.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid #7a6f68',
                  color: '#7a6f68',
                  padding: '0.5rem 1rem',
                  borderRadius: '100px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                No thanks
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onBlock) onBlock();
                  onClose();
                }}
                style={{
                  background: '#9b2335',
                  border: 'none',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  borderRadius: '100px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Block {displayName.split(' ')[0]}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

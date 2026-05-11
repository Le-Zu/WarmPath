import { useEffect, useRef, useState } from 'react';

const TEMPLATES = [
  { label: "I'm attending…", value: "I'm attending " },
  { label: "I'm looking for…", value: "I'm looking for " },
  { label: "I'm hosting…", value: "I'm hosting " },
];

const MAX_LENGTH = 280;

const EXPIRY_OPTIONS = [
  { id: 'none', label: 'No expiry' },
  { id: 'today', label: 'End of today' },
  { id: 'week', label: 'End of this week' },
  { id: 'custom', label: 'Custom date' },
];

// Resolves an option id to a Date or null.
function resolveExpiry(optionId, customValue) {
  const now = new Date();
  if (optionId === 'today') {
    const d = new Date(now);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  if (optionId === 'week') {
    const d = new Date(now);
    const daysUntilSunday = (7 - d.getDay()) % 7 || 7; // Sunday end-of-week
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  if (optionId === 'custom' && customValue) return new Date(customValue);
  return null;
}

// Picks the matching option id when restoring an existing expiry, falling back
// to "custom" so the user can edit the exact datetime.
function inferExpiryOption(expiresAt) {
  if (!expiresAt) return 'none';
  return 'custom';
}

// Formats a Date for an <input type="datetime-local"> (no Z suffix).
function toLocalInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function StatusEditor({
  initialStatus = '',
  initialExpiresAt = null,
  saving = false,
  onSave,
  onClear,
}) {
  const [text, setText] = useState(initialStatus || '');
  const [expiryOption, setExpiryOption] = useState(inferExpiryOption(initialExpiresAt));
  const [customExpiry, setCustomExpiry] = useState(toLocalInput(initialExpiresAt));
  const textareaRef = useRef(null);

  // Re-sync when the initial values change (e.g., the parent fetched user data).
  useEffect(() => {
    setText(initialStatus || '');
    setExpiryOption(inferExpiryOption(initialExpiresAt));
    setCustomExpiry(toLocalInput(initialExpiresAt));
  }, [initialStatus, initialExpiresAt]);

  const applyTemplate = (templateValue) => {
    setText(templateValue);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(templateValue.length, templateValue.length);
      }
    });
  };

  const trimmed = text.trim();
  const expiryDate = resolveExpiry(expiryOption, customExpiry);
  const initialExpiryIso = initialExpiresAt ? new Date(initialExpiresAt).toISOString() : null;
  const newExpiryIso = expiryDate ? expiryDate.toISOString() : null;
  const dirty =
    trimmed !== (initialStatus || '').trim() ||
    initialExpiryIso !== newExpiryIso;
  const canSave = !saving && trimmed.length > 0 && dirty;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSave(trimmed, expiryDate);
  };

  const remaining = MAX_LENGTH - text.length;

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => applyTemplate(t.value)}
            style={{
              fontSize: '0.75rem',
              padding: '0.3rem 0.7rem',
              borderRadius: '999px',
              border: '1px solid rgba(231, 111, 81, 0.4)',
              background: 'rgba(231, 111, 81, 0.06)',
              color: 'var(--warm)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="What are you up to right now?"
        rows={3}
        style={{
          width: '100%',
          padding: '0.7rem 0.8rem',
          borderRadius: '4px',
          border: '1px solid var(--border)',
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.7rem', color: '#9b8880', marginTop: '0.2rem' }}>
        {remaining} characters left
      </div>

      <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.8rem', color: '#7a6f68' }}>Clears after</label>
        <select
          value={expiryOption}
          onChange={(e) => setExpiryOption(e.target.value)}
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            fontSize: '0.85rem',
          }}
        >
          {EXPIRY_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {expiryOption === 'custom' && (
          <input
            type="datetime-local"
            value={customExpiry}
            onChange={(e) => setCustomExpiry(e.target.value)}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              fontSize: '0.85rem',
            }}
          />
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
        <button
          type="submit"
          disabled={!canSave}
          style={{
            background: canSave ? 'LightSalmon' : '#d8c8c0',
            color: '#fff',
            padding: '0.55rem 1.1rem',
            border: 'none',
            borderRadius: '100px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving…' : 'Save status'}
        </button>
        {onClear && initialStatus && (
          <button
            type="button"
            onClick={onClear}
            disabled={saving}
            style={{
              background: 'transparent',
              border: '1px solid #7a6f68',
              color: '#7a6f68',
              padding: '0.55rem 1.1rem',
              borderRadius: '100px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}

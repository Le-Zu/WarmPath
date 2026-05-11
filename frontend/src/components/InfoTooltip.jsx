import { useId, useState } from 'react';

// Small "ⓘ" badge that reveals a short explanation on hover, focus, or click.
// Used to clarify in-app terminology (Connector, Warm Score, Intent, etc.)
// without cluttering the surrounding UI.
export default function InfoTooltip({ text, label = 'More info', width = 220 }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        marginLeft: '6px',
        verticalAlign: 'middle',
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        style={{
          cursor: 'help',
          color: 'var(--warm)',
          fontSize: '0.7rem',
          border: '1px solid var(--warm)',
          borderRadius: '50%',
          width: '14px',
          height: '14px',
          padding: 0,
          background: 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontFamily: 'inherit',
          lineHeight: 1,
        }}
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="info-tooltip-content"
          style={{
            width: `${width}px`,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

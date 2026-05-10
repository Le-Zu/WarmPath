import { useNavigate } from 'react-router-dom';

const MIN_CONNECTORS = 3;

// Static, intent-keyed prompts. Easy to swap for an AI generator later.
const INTENT_COPY = {
  internship: {
    title: 'Looking for an internship?',
    body: "Add classmates, recent interns, or alumni from your major — they're often the bridge to the role you want.",
  },
  research: {
    title: 'Hunting for research?',
    body: "Add professors, lab mates, or upperclassmen who've worked in labs near your interest.",
  },
  class: {
    title: 'Need help with a class?',
    body: 'Add classmates from your toughest courses or older students who took them and aced them.',
  },
  club: {
    title: 'Looking to join a club?',
    body: "Add officers and members from organizations you'd want to be part of.",
  },
  skill: {
    title: 'Picking up a new skill?',
    body: 'Add peers, mentors, or alums who already work with that skill day-to-day.',
  },
};

const GENERIC_COPY = {
  title: 'Your network is just getting started',
  body: 'Warm paths only show up through people you know. Add a few connectors to unlock more options.',
};

export default function ConnectionNudge({ count, intent, onAddConnector }) {
  const navigate = useNavigate();

  if (count == null || count >= MIN_CONNECTORS) return null;

  const copy = (intent && INTENT_COPY[intent]) || GENERIC_COPY;

  const handleClick = () => {
    if (onAddConnector) onAddConnector();
    else navigate('/paths');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
        background: 'rgba(231, 111, 81, 0.06)',
        border: '1px solid rgba(231, 111, 81, 0.25)',
        borderRadius: '6px',
        textAlign: 'left',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: '220px' }}>
        <div
          style={{
            fontSize: '0.92rem',
            fontWeight: 600,
            color: 'var(--dark)',
            marginBottom: '0.2rem',
          }}
        >
          {copy.title}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#7a6f68', lineHeight: 1.5 }}>
          {copy.body}
          <span style={{ color: '#9b8880', marginLeft: '0.4rem', whiteSpace: 'nowrap' }}>
            ({count}/{MIN_CONNECTORS} connectors)
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleClick}
        style={{
          background: 'LightSalmon',
          color: '#fff',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '100px',
          fontWeight: 600,
          fontSize: '0.8rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {onAddConnector ? '+ Add a Connector' : 'Set up connectors'}
      </button>
    </div>
  );
}

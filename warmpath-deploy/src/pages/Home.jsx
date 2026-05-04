import { useNavigate } from 'react-router-dom';
const intents = [
  { id: 'internship', label: '💼  Internship', desc: "Find someone with industry experience in your target field" },
  { id: 'research',   label: '🔬  Research',   desc: "Connect with a professor or lab doing work you care about" },
  { id: 'classhelp',  label: '📚  Class Help',  desc: "Get connected to someone who aced the course you're struggling in" },
  { id: 'club',       label: '🏛  Club / Org',  desc: "Find a warm intro into a club, team, or student org" },
];
export default function Home() {
  const nav = useNavigate();
  return (
    <div className="page">
      <div className="page-eyebrow">— Declare your intent</div>
      <div className="page-title">What are you looking for?</div>
      <div className="page-sub">Choose a goal and we'll surface the best warm paths for you.</div>
      <div className="intent-options-list">
        {intents.map(it => (
          <button key={it.id} className="intent-option" onClick={() => nav('/paths')}>
            <div className="intent-option-label">{it.label}</div>
            <div className="intent-option-desc">{it.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

import PathCard from '../components/PathCard.jsx';
import { mockPaths } from '../data/mockData.js';
export default function Paths() {
  return (
    <div className="page">
      <div className="page-eyebrow">— Your warm paths</div>
      <div className="page-title">Found {mockPaths.length} paths</div>
      <div className="page-sub">Ranked by connection strength. Request an intro to get started.</div>
      {mockPaths.map(p => <PathCard key={p.id} path={p} />)}
    </div>
  );
}

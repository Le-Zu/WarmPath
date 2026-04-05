import { useState, useEffect } from 'react';
import PathCard from '../components/PathCard.jsx';
import { getPaths } from '../api/paths.js';

export default function Paths() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPaths()
      .then(({ paths }) => setPaths(paths))
      .catch((err) => {
        console.error('[Paths] Failed to fetch paths:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="app-page">Finding warm paths...</div>;
  if (error) return <div className="app-page">Failed to load paths.</div>;

  return (
    <div className="app-page">
      <div className="app-eyebrow">— Warm paths</div>
      <div className="app-page-title">Found {paths.length} paths</div>
      <div className="app-page-sub">Ranked by connection strength. Request an intro to get started.</div>
      {paths.map(p => <PathCard key={p.id} path={p} />)}
    </div>
  );
}

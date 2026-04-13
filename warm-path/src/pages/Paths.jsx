import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PathCard from '../components/PathCard.jsx';
import { getPaths } from '../api/paths.js';

// Human-readable label for each intent enum value used in empty state copy
const INTENT_LABELS = {
  internship: 'internship',
  research:   'research',
  class:      'class help',
  club:       'club',
  skill:      'skill',
};

export default function Paths() {
  const [searchParams] = useSearchParams();
  const intent = searchParams.get('intent') || null;

  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPaths(intent)
      .then(({ paths }) => setPaths(paths))
      .catch((err) => {
        console.error('[Paths] Failed to fetch paths:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [intent]);

  if (loading) return <div className="app-page">Finding warm paths...</div>;
  if (error)   return <div className="app-page">Failed to load paths.</div>;

  const intentLabel = intent ? INTENT_LABELS[intent] ?? intent : null;

  return (
    <div className="app-page">
      <div className="app-eyebrow">— Warm paths</div>
      <div className="app-page-title">
        {paths.length > 0 ? `Found ${paths.length} paths` : 'No paths found'}
      </div>
      <div className="app-page-sub">
        {paths.length > 0
          ? 'Ranked by connection strength. Request an intro to get started.'
          : intentLabel
            ? `No warm paths for ${intentLabel} yet. Try a different intent or check back as your network grows.`
            : 'Paths appear when you have mutual connections with someone. Build your network and check back.'}
      </div>
      {paths.map(p => <PathCard key={p.id} path={p} />)}
    </div>
  );
}

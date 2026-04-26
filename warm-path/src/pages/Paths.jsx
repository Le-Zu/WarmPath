import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PathCard from '../components/PathCard.jsx';
import { getPaths } from '../api/paths.js';
import { calculateBatchWarmthScores } from '../api/gemini.js';

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
      .then(async ({ paths: fetchedPaths }) => {
        setPaths(fetchedPaths.map(p => ({ ...p, warmthScore: '...' })));
        
        if (fetchedPaths.length > 0) {
          const scores = await calculateBatchWarmthScores(fetchedPaths.map(p => p.aiMetadata));
          setPaths(fetchedPaths.map((p, i) => ({
            ...p,
            warmthScore: scores[i] ?? 'N/A'
          })));
        }
      })
      .catch((err) => {
        console.error('[Paths] Failed to fetch paths:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [intent]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newConn, setNewConn] = useState({ name: '', email: '', relationship: '' });
  const [savingConn, setSavingConn] = useState(false);

  const handleAddConnector = async (e) => {
    e.preventDefault();
    if (!newConn.email || !newConn.relationship) return;
    setSavingConn(true);
    try {
      await apiFetch('/api/connections', {
        method: 'POST',
        body: JSON.stringify({
          email: newConn.email,
          context: newConn.relationship,
        }),
      });
      alert('Connector added! This will help discover more paths.');
      setShowAddForm(false);
      setNewConn({ name: '', email: '', relationship: '' });
      // Reload paths
      getPaths(intent).then(({ paths: fetchedPaths }) => setPaths(fetchedPaths));
    } catch (err) {
      alert('Failed to add connector: ' + err.message);
    } finally {
      setSavingConn(false);
    }
  };

  if (loading) return <div className="app-page">Finding warm paths...</div>;
  if (error)   return <div className="app-page">Failed to load paths.</div>;

  const intentLabel = intent ? INTENT_LABELS[intent] ?? intent : null;

  return (
    <div className="app-page">
      <div className="app-eyebrow">— Warm paths —</div>
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

      {paths.length === 0 && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '2rem', 
          background: '#fff', 
          border: '1px dashed #d88c9a', 
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--dark)' }}>Expand your network</h3>
          <p style={{ fontSize: '0.88rem', color: '#7a6f68', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Paths are discovered through your existing connections. Add a connector you already know to help WarmPath find more paths for you.
          </p>
          
          {!showAddForm ? (
            <button 
              onClick={() => setShowAddForm(true)}
              style={{
                backgroundColor: 'LightSalmon',
                padding: '0.75rem 1.5rem',
                borderRadius: '100px',
                border: 'none',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Add a Connector
            </button>
          ) : (
            <form onSubmit={handleAddConnector} style={{ maxWidth: '360px', margin: '0 auto', textAlign: 'left' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>Name</label>
                <input 
                  type="text" 
                  value={newConn.name} 
                  onChange={e => setNewConn({...newConn, name: e.target.value})}
                  placeholder="Alex Rivera"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>Email *</label>
                <input 
                  type="email" 
                  required
                  value={newConn.email} 
                  onChange={e => setNewConn({...newConn, email: e.target.value})}
                  placeholder="alex@example.com"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>Relationship Context *</label>
                <input 
                  type="text" 
                  required
                  value={newConn.relationship} 
                  onChange={e => setNewConn({...newConn, relationship: e.target.value})}
                  placeholder="e.g. Worked together in CS 499"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={savingConn} style={btnPrimary}>
                  {savingConn ? 'Saving...' : 'Add Connector'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} style={btnSecondary}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {paths.map(p => <PathCard key={p.id} path={p} score={p.warmthScore} />)}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  borderRadius: '4px',
  border: '1px solid var(--border)',
  fontSize: '0.9rem',
  boxSizing: 'border-box'
};

const btnPrimary = {
  backgroundColor: 'LightSalmon',
  padding: '0.6rem 1.2rem',
  borderRadius: '100px',
  border: 'none',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const btnSecondary = {
  backgroundColor: 'transparent',
  padding: '0.6rem 1.2rem',
  borderRadius: '100px',
  border: '1px solid #7a6f68',
  color: '#7a6f68',
  fontWeight: 'bold',
  cursor: 'pointer'
};

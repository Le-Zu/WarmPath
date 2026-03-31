import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import OnboardingFlow from './OnboardingFlow';
import SettingsPage from './SettingsPage';
import './global.css';

function App() {
  const [page, setPage] = useState(window.location.hash);

  useEffect(() => {
    const onHash = () => setPage(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (page === '#settings') return <SettingsPage />;
  return <OnboardingFlow />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import apiFetch from './client.js';

// Fetches the authenticated user's discovered warm paths, optionally filtered by intent category
export const getPaths = (intent) => {
  const url = intent ? `/api/paths?intent=${encodeURIComponent(intent)}` : '/api/paths';
  return apiFetch(url);
};

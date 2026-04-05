import apiFetch from './client.js';

// Fetches the authenticated user's discovered warm paths
export const getPaths = () => apiFetch('/api/paths');

import apiFetch from './client.js';

// Fetches the current authenticated user's profile from the database
export const getMe = () => apiFetch('/api/me');

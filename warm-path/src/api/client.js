import apiUrl from '../apiConfig.js';
import { auth } from '../firebase.js';

// Authenticated fetch wrapper — injects the Firebase ID token on every request
const apiFetch = async (path, options = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const token = await user.getIdToken();

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  return response.json();
};

export default apiFetch;

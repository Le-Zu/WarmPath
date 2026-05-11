import apiUrl from '@/config/apiConfig';
import { auth } from '@/config/firebase';
import { startRequest, endRequest } from './requestTracker';

// Authenticated fetch wrapper — injects the Firebase ID token on every request
const apiFetch = async (path, options = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const token = await user.getIdToken();

  const trackerId = startRequest();
  let response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch (networkErr) {
    endRequest(trackerId, false);
    throw networkErr;
  }

  endRequest(trackerId, true);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.error || body.message || `Request failed: ${response.status}`);
    err.status = response.status;
    err.body = body;
    throw err;
  }

  return response.json();
};

export default apiFetch;

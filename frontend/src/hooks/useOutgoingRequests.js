import { useState, useEffect } from 'react';
import apiFetch from '@/services/client';

/**
 * Hook to manage outgoing intro requests.
 * @returns {{ requests: Array, loading: boolean, error: string|null }}
 */
export function useOutgoingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/requests/outgoing')
      .then(({ requests }) => setRequests(requests))
      .catch((err) => {
        console.error('[useOutgoingRequests] Failed to fetch requests:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { requests, loading, error };
}

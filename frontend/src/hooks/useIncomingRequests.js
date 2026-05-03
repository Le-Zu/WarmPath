import { useState, useEffect } from 'react';
import apiFetch from '@/services/client';

/**
 * Hook to manage incoming intro requests (Connector inbox).
 * @returns {{ requests: Array, loading: boolean, error: string|null, updateRequestStatus: Function, patchRequest: Function }}
 */
export function useIncomingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/requests/incoming')
      .then(({ requests }) => setRequests(requests))
      .catch((err) => {
        console.error('[useIncomingRequests] Failed to fetch incoming requests:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateRequestStatus = (id, status) => {
    setRequests(r => r.map(x => x.id === id ? { ...x, status } : x));
  };

  const patchRequest = async (id, body) => {
    const response = await apiFetch(`/api/requests/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    });
    return response;
  };

  return { requests, loading, error, updateRequestStatus, patchRequest };
}

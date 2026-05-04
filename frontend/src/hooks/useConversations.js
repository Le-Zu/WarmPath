import { useState, useEffect } from 'react';
import apiFetch from '@/services/client';

/**
 * Hook to manage the list of active conversations.
 * @returns {{ conversations: Array, loading: boolean, error: string|null }}
 */
export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/conversations')
      .then(({ conversations }) => {
        setConversations(conversations);
        setError(null);
      })
      .catch((err) => {
        console.error('[useConversations] Error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { conversations, loading, error };
}

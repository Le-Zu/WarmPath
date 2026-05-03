import apiFetch from './client.js';

export const getConnections = () => apiFetch('/api/connections');
export const requestConnection = (peerId, context, warmthScore) => 
  apiFetch('/api/connections', {
    method: 'POST',
    body: JSON.stringify({ peerId, context, warmth_score: warmthScore }),
  });
export const respondToConnection = (id, status) => 
  apiFetch(`/api/connections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

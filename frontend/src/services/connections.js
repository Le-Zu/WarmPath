import apiFetch from './client.js';

export const getConnections = () => apiFetch('/api/connections');
export const requestConnection = (peerId, context, connectorScore) => 
  apiFetch('/api/connections', {
    method: 'POST',
    body: JSON.stringify({ peerId, context, connector_score: connectorScore }),
  });
export const respondToConnection = (id, status) => 
  apiFetch(`/api/connections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const removeConnection = (id) =>
  apiFetch(`/api/connections/${id}`, {
    method: 'DELETE',
  });

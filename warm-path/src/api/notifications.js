import apiFetch from './client.js';

export const getNotifications = () => apiFetch('/api/notifications');
export const markRead = (id) => apiFetch(`/api/notifications/${id}`, { method: 'PATCH' });

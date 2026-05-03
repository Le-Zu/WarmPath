import apiFetch from './client.js';

export const getConversations = () => apiFetch('/api/conversations');
export const getMessages = (conversationId) => apiFetch(`/api/conversations/${conversationId}/messages`);
export const sendMessage = (conversationId, body, isWarmIntro = false) => 
  apiFetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, is_warm_intro: isWarmIntro }),
  });

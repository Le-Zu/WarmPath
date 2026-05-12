import { useState, useEffect, useRef } from 'react';
import apiFetch from '@/services/client';

/**
 * Hook to manage chat state, including messages, socket events, and conversation metadata.
 * @param {string} id - Conversation ID.
 * @param {Object} socket - Socket instance.
 * @returns {Object} Chat state and actions.
 */
export function useChat(id, socket) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(null);
  const [preread, setPreread] = useState(null);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setLoading(true);
    // Fetch conversation metadata
    apiFetch(`/api/conversations/${id}`)
      .then(({ conversation }) => {
        setConversation(conversation);
      })
      .catch((err) => console.error("[useChat] Metadata Error:", err));

    // Fetch initial messages
    apiFetch(`/api/conversations/${id}/messages`)
      .then(({ messages }) => {
        setMessages(messages);
        setLoading(false);
        // Delay scroll to ensure DOM is ready
        setTimeout(scrollToBottom, 50);
      })
      .catch((err) => {
        console.error("[useChat] Error:", err);
        setLoading(false);
      });

    // Fetch context pre-read
    apiFetch(`/api/conversations/${id}/preread`)
      .then(({ preread }) => {
        setPreread(preread);
      })
      .catch((err) => console.error("[useChat] Preread Error:", err));

    if (socket) {
      socket.emit("join_conversation", id);

      socket.on("new_message", (message) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on("user_left", (data) => {
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.map((p) =>
              p.user_id === data.userId ? { ...p, left_at: data.leftAt } : p
            ),
          };
        });
      });

      socket.on("user_typing", (data) => {
        if (data.isTyping) {
          setTyping(data.userName);
        } else {
          setTyping(null);
        }
      });

      return () => {
        socket.off("new_message");
        socket.off("user_typing");
      };
    }
  }, [id, socket]);

  useEffect(scrollToBottom, [messages]);

  const sendMessage = (body) => {
    if (!body.trim() || !socket) return;
    socket.emit("send_message", { conversationId: id, body });
    socket.emit("typing", { conversationId: id, isTyping: false });
  };

  const setTypingState = (isTyping) => {
    if (socket) {
      socket.emit("typing", { conversationId: id, isTyping });
    }
  };

  return { 
    messages, 
    loading, 
    typing, 
    preread, 
    conversation, 
    messagesEndRef, 
    sendMessage, 
    setTypingState,
    scrollToBottom
  };
}

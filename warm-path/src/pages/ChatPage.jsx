import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiFetch from "../api/client.js";
import { useSocket } from "../contexts/SocketContextInstance.js";
import { useUser } from "../contexts/UserContext.jsx";

export default function ChatPage() {
   const { id } = useParams();
   const navigate = useNavigate();
   const { user } = useUser();
   const socket = useSocket();

   const [messages, setMessages] = useState([]);
   const [newMessage, setNewMessage] = useState("");
   const [loading, setLoading] = useState(true);
   const [typing, setTyping] = useState(null);
   const messagesEndRef = useRef(null);

   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   };

   useEffect(() => {
      // Fetch initial messages
      apiFetch(`/api/conversations/${id}/messages`)
         .then(({ messages }) => {
            setMessages(messages);
            setLoading(false);
            scrollToBottom();
         })
         .catch((err) => {
            console.error("[Chat] Error:", err);
            setLoading(false);
         });

      if (socket) {
         socket.emit("join_conversation", id);

         socket.on("new_message", (message) => {
            setMessages((prev) => [...prev, message]);
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

   const handleSendMessage = (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !socket) return;

      socket.emit("send_message", { conversationId: id, body: newMessage });
      socket.emit("typing", { conversationId: id, isTyping: false });
      setNewMessage("");
   };

   const handleTyping = (e) => {
      setNewMessage(e.target.value);
      if (socket) {
         socket.emit("typing", {
            conversationId: id,
            isTyping: e.target.value.length > 0,
         });
      }
   };

   const handleLeaveChat = () => {
      if (
         window.confirm(
            "You may leave the chat after facilitating. Are you sure?",
         )
      ) {
         if (socket) {
            socket.emit("leave_conversation", id);
         }
         navigate("/conversations");
      }
   };

   if (loading) return <div className="app-page">Loading chat...</div>;

   return (
      <div
         className="app-page"
         style={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 120px)",
         }}
      >
         <div
            style={{
               display: "flex",
               alignItems: "center",
               marginBottom: "1rem",
            }}
         >
            <button
               className="btn-ghost"
               onClick={() => navigate("/conversations")}
               style={{ marginRight: "1rem", padding: "0.4rem" }}
            >
               ←
            </button>
            <div className="app-page-title" style={{ marginBottom: 0 }}>
               Chat
            </div>
            <button
               onClick={handleLeaveChat}
               style={{
                  fontSize: "0.85rem",
                  padding: "0.5rem 1rem",
                  marginLeft: "670px",
                  borderRadius: "6px",
                  border: "1px solid #d88c9a",
                  background: "transparent",
                  color: "#d88c9a",
                  cursor: "pointer",
                  fontWeight: "500",
               }}
            >
               Leave Chat
            </button>
         </div>

         <div
            style={{
               flex: 1,
               overflowY: "auto",
               padding: "1rem",
               background: "var(--cream)",
               borderRadius: "8px",
               marginBottom: "1rem",
            }}
         >
            {messages.map((m) => (
               <div
                  key={m.message_id}
                  style={{
                     display: "flex",
                     flexDirection: "column",
                     alignItems:
                        m.sender_id === user?.user_id
                           ? "flex-end"
                           : "flex-start",
                     marginBottom: "1rem",
                  }}
               >
                  <div
                     style={{
                        fontSize: "0.7rem",
                        color: "#7a6f68",
                        marginBottom: "0.2rem",
                     }}
                  >
                     {m.sender_id === user?.user_id
                        ? "You"
                        : `${m.sender.first_name} ${m.sender.last_name}`}
                  </div>
                  <div
                     style={{
                        background:
                           m.sender_id === user?.user_id
                              ? "var(--warm)"
                              : "white",
                        color:
                           m.sender_id === user?.user_id
                              ? "white"
                              : "var(--dark)",
                        padding: "0.6rem 1rem",
                        borderRadius: "12px",
                        maxWidth: "80%",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                     }}
                  >
                     {m.body}
                  </div>
               </div>
            ))}
            {typing && (
               <div
                  style={{
                     fontSize: "0.75rem",
                     color: "#7a6f68",
                     fontStyle: "italic",
                  }}
               >
                  {typing} is typing...
               </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         <form
            onSubmit={handleSendMessage}
            style={{ display: "flex", gap: "0.5rem" }}
         >
            <input
               type="text"
               value={newMessage}
               onChange={handleTyping}
               placeholder="Type a message..."
               style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
               }}
            />
            <button
               type="submit"
               className="btn-primary"
               style={{ padding: "0.75rem 1.5rem" }}
            >
               Send
            </button>
         </form>
      </div>
   );
}

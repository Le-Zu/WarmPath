import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { useSocket } from "@/context/SocketContextInstance";
import { useUser } from "@/context/UserContext";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
   const { id } = useParams();
   const navigate = useNavigate();
   const { currentUser } = useUser();
   const socket = useSocket();

   const { 
     messages, 
     loading, 
     typing, 
     preread, 
     conversation, 
     messagesEndRef, 
     sendMessage, 
     setTypingState 
   } = useChat(id, socket);

   const [newMessage, setNewMessage] = useState("");
   const [isPrereadOpen, setIsPrereadOpen] = useState(false);

   const handleSendMessage = (e) => {
      e.preventDefault();
      if (!newMessage.trim()) return;
      sendMessage(newMessage);
      setNewMessage("");
   };

   const handleTyping = (e) => {
      setNewMessage(e.target.value);
      setTypingState(e.target.value.length > 0);
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
               style={{ marginRight: "1rem", padding: "0.4rem", display: "inline-flex", alignItems: "center" }}
               aria-label="Back to conversations"
            >
               <ArrowLeft size={20} strokeWidth={2} />
            </button>
            <div className="app-page-title" style={{ marginBottom: 0 }}>
               Chat
            </div>
            <button
               onClick={handleLeaveChat}
               style={{
                  fontSize: "0.85rem",
                  padding: "0.5rem 1rem",
                  marginLeft: "auto",
                  borderRadius: "6px",
                  border: "1px solid #d88c9a",
                  whiteSpace: "nowrap",
                  background: "transparent",
                  color: "#d88c9a",
                  cursor: "pointer",
                  fontWeight: "500",
               }}
            >
               Leave Room
            </button>
         </div>

         {preread && (
            <div
               style={{
                  background: "white",
                  border: "1px solid #e8ddd8",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  marginBottom: "1rem",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
               }}
            >
               <div
                  style={{
                     display: "flex",
                     justifyContent: "space-between",
                     alignItems: "center",
                     cursor: "pointer",
                  }}
                  onClick={() => setIsPrereadOpen(!isPrereadOpen)}
               >
                  <div
                     style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                     }}
                  >
                     <Lightbulb size={18} strokeWidth={2} color="#e9c46a" />
                     <span
                        style={{
                           fontSize: "0.85rem",
                           fontWeight: 600,
                           color: "var(--dark)",
                        }}
                     >
                        Context Pre-Read: {preread.subject.first_name}
                     </span>
                  </div>
                  <button
                     style={{
                        background: "none",
                        border: "none",
                        color: "var(--warm)",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        cursor: "pointer",
                     }}
                  >
                     {isPrereadOpen ? "Hide" : "View Details"}
                  </button>
               </div>
               {isPrereadOpen && (
                  <div
                     style={{
                        marginTop: "0.75rem",
                        fontSize: "0.85rem",
                        color: "#5a5550",
                        lineHeight: "1.5",
                        borderTop: "1px solid #f2e9e4",
                        paddingTop: "0.75rem",
                        whiteSpace: "pre-wrap",
                     }}
                  >
                     {preread.summary}
                  </div>
               )}
            </div>
         )}

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
                        m.sender_id === currentUser?.user_id
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
                     {m.sender_id === currentUser?.user_id
                        ? "You"
                        : `${m.sender.first_name} ${m.sender.last_name}`}
                  </div>
                  <div
                     style={{
                        background:
                           m.sender_id === currentUser?.user_id
                              ? "var(--warm)"
                              : "white",
                        color:
                           m.sender_id === currentUser?.user_id
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

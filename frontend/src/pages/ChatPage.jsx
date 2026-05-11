import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, Flag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSocket } from "@/context/SocketContextInstance";
import { useUser } from "@/context/UserContext";
import { WarmthScore } from "@/features/gemini";
import { useChat } from "@/hooks/useChat";
import InfoTooltip from "@/components/InfoTooltip";
import ReportMessageModal from "@/components/ReportMessageModal";
import apiFetch from "@/services/client";
import { useToast } from "@/context/ToastContext";

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
   const [reportTarget, setReportTarget] = useState(null);
   const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
   const [leaveReason, setLeaveReason] = useState("");
   const [isLeaving, setIsLeaving] = useState(false);
   const toast = useToast();

   const blockUser = async (user) => {
      try {
         await apiFetch('/api/blocks', {
            method: 'POST',
            body: JSON.stringify({ blocked_id: user.user_id }),
         });
         const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'this person';
         toast(`${name} has been blocked.`);
         if (socket) socket.emit('leave_conversation', id);
         navigate('/conversations');
      } catch (err) {
         toast(`Could not block: ${err.message || 'unknown error'}`, 'error');
      }
   };

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
      setIsLeaveModalOpen(true);
   };

   const confirmLeaveChat = async () => {
      setIsLeaving(true);
      try {
         await apiFetch(`/api/conversations/${id}/leave`, {
            method: 'POST',
            body: JSON.stringify({ reason: leaveReason }),
         });
         if (socket) socket.emit('leave_conversation', id);
         navigate('/conversations');
      } catch (err) {
         toast(`Could not leave chat: ${err.message}`, 'error');
      } finally {
         setIsLeaving(false);
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
            {conversation?.warm_score && (
               <div style={{ marginLeft: "1.5rem", display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#7a6f68", marginRight: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center" }}>
                     Warm Score
                     <InfoTooltip
                        label="What is the Warm Score?"
                        text="An AI-estimated read on how well this conversation matches your intent. More flames mean a stronger fit between your goals and this person's background."
                        width={240}
                     />
                  </span>
                  <WarmthScore score={conversation.warm_score} />
               </div>
            )}
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
               Leave Chat
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
                        title="A short summary of why you're meeting, generated when the intro was approved. Both of you see the same one."
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
                     }}
                  >
                     <ReactMarkdown
                        components={{
                           p: ({ ...props }) => <p style={{ margin: 0 }} {...props} />,
                        }}
                     >
                        {preread.summary}
                     </ReactMarkdown>
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
                  {m.sender_id !== currentUser?.user_id && m.sender && (
                     <button
                        type="button"
                        onClick={() => setReportTarget({ message: m, user: m.sender })}
                        aria-label="Report this message"
                        title="Report"
                        style={{
                           background: 'transparent',
                           border: 'none',
                           color: '#9b8880',
                           cursor: 'pointer',
                           padding: '0.15rem 0.25rem',
                           marginTop: '0.2rem',
                           fontSize: '0.7rem',
                           display: 'inline-flex',
                           alignItems: 'center',
                           gap: '0.25rem',
                        }}
                     >
                        <Flag size={11} strokeWidth={2} />
                        Report
                     </button>
                  )}
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

         {reportTarget && (
            <ReportMessageModal
               message={reportTarget.message}
               reportedUser={reportTarget.user}
               onClose={() => setReportTarget(null)}
               onBlock={() => blockUser(reportTarget.user)}
            />
         )}

         {isLeaveModalOpen && (
            <div style={{
               position: 'fixed',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               background: 'rgba(0,0,0,0.5)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 1000,
               padding: '1rem'
            }}>
               <div className="app-card" style={{ maxWidth: '400px', width: '100%', padding: '1.5rem' }}>
                  <div className="app-page-title" style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Leave Chat?</div>
                  <p style={{ fontSize: '0.88rem', color: '#5a5550', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                     You can leave this chat if the intro is complete. Other participants will still be able to message each other.
                  </p>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                     <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--dark)', marginBottom: '0.5rem' }}>
                        Why are you leaving? (Private feedback for developers)
                     </label>
                     <textarea
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="e.g. Intro completed, no longer relevant..."
                        style={{ 
                           width: '100%', 
                           padding: '0.75rem', 
                           borderRadius: '6px', 
                           border: '1px solid var(--border)', 
                           fontSize: '0.88rem',
                           minHeight: '80px',
                           fontFamily: 'inherit',
                           resize: 'vertical'
                        }}
                     />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                     <button 
                        onClick={() => setIsLeaveModalOpen(false)}
                        className="btn-ghost"
                        style={{ flex: 1, padding: '0.75rem' }}
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={confirmLeaveChat}
                        disabled={isLeaving}
                        className="btn-primary"
                        style={{ flex: 1, padding: '0.75rem', background: '#d88c9a', borderColor: '#d88c9a', fontWeight: 600 }}
                     >
                        {isLeaving ? 'Leaving...' : 'Leave Chat'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

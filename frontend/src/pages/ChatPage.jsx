import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, Flag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSocket } from "@/context/SocketContextInstance";
import { useUser } from "@/context/UserContext";
import { WarmthScore } from "@/features/gemini";
import { useChat } from "@/hooks/useChat";
import InfoTooltip from "@/components/InfoTooltip";
import ReportMessageModal from "@/components/ReportMessageModal";
import ConfirmationModal from "@/components/ConfirmationModal";
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
            method: 'POST'
         });
         if (socket) socket.emit('leave_conversation', id);
         navigate('/conversations');
      } catch (err) {
         toast(`Could not leave chat: ${err.message}`, 'error');
      } finally {
         setIsLeaving(false);
      }
   };

   const combinedItems = useMemo(() => {
      const messageItems = messages.map(m => ({
         type: 'message',
         timestamp: new Date(m.created_at).getTime(),
         ...m
      }));

      const leaveEvents = conversation?.participants
         ?.filter(p => p.left_at)
         .map(p => {
            // Use == for loose equality to handle string/number ID mismatches
            const userMessages = messageItems.filter(m => m.sender_id == p.user_id);
            const lastMsgTs = userMessages.length > 0 
               ? Math.max(...userMessages.map(m => m.timestamp)) 
               : 0;
            
            // Ensure leave timestamp is at least 1ms after THEIR last message
            const actualLeaveTs = new Date(p.left_at).getTime();
            const adjustedTs = Math.max(actualLeaveTs, lastMsgTs + 1);

            return {
               type: 'leave',
               timestamp: adjustedTs,
               user: p.user,
               user_id: p.user_id
            };
         }) || [];

      return [...leaveEvents, ...messageItems].sort((a, b) => {
         if (a.timestamp === b.timestamp) {
            // If same timestamp, messages come first, then leave events
            return a.type === 'message' ? -1 : 1;
         }
         return a.timestamp - b.timestamp;
      });
   }, [messages, conversation]);

   const isLeft = conversation?.participants?.find(p => p.user_id === currentUser?.user_id)?.left_at;

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
            {!isLeft && (
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
            )}
         </div>

         {preread && (
            <div
               style={{
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderTop: "4px solid var(--warm)",
                  borderRadius: "4px",
                  padding: "1rem 1.25rem",
                  marginBottom: "1.5rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  transition: "all 0.2s ease",
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
                        gap: "0.6rem",
                     }}
                  >
                     <Lightbulb size={18} strokeWidth={2} color="var(--warm)" />
                     <span
                        style={{
                           fontSize: "0.95rem",
                           fontWeight: 600,
                           fontFamily: "var(--font-serif)",
                           color: "var(--dark)",
                           letterSpacing: "0.01em",
                        }}
                        title="A short summary of why you're meeting, generated when the intro was approved. Both of you see the same one."
                     >
                        Context Pre-Read: {preread.subject.first_name}
                     </span>
                  </div>
                  <button
                     style={{
                        background: "rgba(231, 111, 81, 0.08)",
                        border: "none",
                        color: "var(--warm)",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "0.3rem 0.6rem",
                        borderRadius: "2px",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        transition: "background 0.15s",
                     }}
                  >
                     {isPrereadOpen ? "Hide" : "View Details"}
                  </button>
               </div>
               {isPrereadOpen && (
                  <div
                     style={{
                        marginTop: "1rem",
                        fontSize: "0.88rem",
                        color: "var(--charcoal)",
                        lineHeight: "1.6",
                        borderTop: "1px solid rgba(0,0,0,0.05)",
                        padding: "1rem",
                        background: "rgba(231, 111, 81, 0.02)",
                        borderRadius: "2px",
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
            {combinedItems.map((item) => {
               if (item.type === 'leave') {
                  return (
                     <div 
                        key={`left-${item.user_id}`}
                        style={{
                           textAlign: 'center',
                           fontSize: '0.75rem',
                           color: '#9b8880',
                           margin: '0.5rem 0 1rem',
                           fontStyle: 'italic',
                           background: 'rgba(0,0,0,0.03)',
                           padding: '0.4rem',
                           borderRadius: '4px'
                        }}
                     >
                        {[item.user.first_name, item.user.last_name].filter(Boolean).join(' ') || item.user.email} has left the chat.
                     </div>
                  );
               }

               const m = item;
               return (
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
               );
            })}
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
               placeholder={isLeft ? "You have left this chat" : "Type a message..."}
               disabled={isLeft}
               style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: isLeft ? "#f9f9f9" : "white"
               }}
            />
            <button
               type="submit"
               className="btn-primary"
               disabled={isLeft || !newMessage.trim()}
               style={{ padding: "0.75rem 1.5rem", opacity: isLeft ? 0.5 : 1 }}
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

         <ConfirmationModal
            isOpen={isLeaveModalOpen}
            onClose={() => setIsLeaveModalOpen(false)}
            onConfirm={confirmLeaveChat}
            title="Leave Chat?"
            message="You can leave this chat if the intro is complete. Other participants will still be able to message each other."
            confirmText="Leave Chat"
            isDanger={true}
            isLoading={isLeaving}
         />
      </div>
   );
}

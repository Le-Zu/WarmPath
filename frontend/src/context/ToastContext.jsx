import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { Check, X, MessageSquare } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
   return useContext(ToastContext);
}

const styleSheet = `
@keyframes wp-toast-slide-down {
   from {
      opacity: 0;
      transform: translateY(-16px) scale(0.95);
   }
   to {
      opacity: 1;
      transform: translateY(0) scale(1);
   }
}

@keyframes wp-toast-progress {
   from {
      width: 100%;
   }
   to {
      width: 0%;
   }
}
`;

export function ToastProvider({ children }) {
   const [toasts, setToasts] = useState([]);
   const idRef = useRef(0);
   const messageStreamRef = useRef([]);

   const toast = useCallback((message, type = "success", options = {}) => {
      const id = ++idRef.current;

      if (type === "message") {
         setToasts((prev) => {
            const hasActiveMessage = prev.some((t) => t.type === "message");
            if (!hasActiveMessage) {
               messageStreamRef.current = [];
            }

            let sender = "Someone";
            let text = message;
            if (options.sender) {
               sender = options.sender;
            } else if (typeof message === "string") {
               if (message.includes(":")) {
                  const parts = message.split(":");
                  sender = parts[0].trim();
                  text = parts.slice(1).join(":").trim();
               } else if (message.includes("sent you a message")) {
                  sender = message.split("sent you a message")[0].trim();
               } else if (message.startsWith("New message from ")) {
                  sender = message.replace("New message from ", "").trim();
               }
            }

            messageStreamRef.current.push({ sender, text, timestamp: Date.now() });
            const stream = messageStreamRef.current;

            let aggregatedMessage = message;
            const uniqueSenders = Array.from(new Set(stream.map((m) => m.sender)));
            const N = uniqueSenders.length;

            if (stream.length === 1) {
               aggregatedMessage = `${sender}: ${text}`;
            } else {
               if (N === 1) {
                  aggregatedMessage = `${uniqueSenders[0]} sent ${stream.length} messages`;
               } else if (N === 2) {
                  aggregatedMessage = `${uniqueSenders[0]} and ${uniqueSenders[1]} sent messages`;
               } else {
                  aggregatedMessage = `${uniqueSenders[0]}, ${uniqueSenders[1]}, and ${N - 2} others sent messages`;
               }
            }

            const filtered = prev.filter((t) => t.type !== "message");
            return [...filtered, { id, message: aggregatedMessage, type, count: stream.length }];
         });
      } else {
         setToasts((prev) => {
            const matchIndex = prev.findIndex((t) => {
               if (t.type !== type) return false;
               const base1 = t.baseMessage || t.message;
               const base2 = message;
               return base1 === base2;
            });

            if (matchIndex !== -1) {
               const matchedToast = prev[matchIndex];
               const newCount = (matchedToast.count || 1) + 1;

               let aggregatedMessage = message;
               if (message.includes("Connector added!")) {
                  aggregatedMessage = `${newCount} connectors added! This will help discover more paths.`;
               } else if (message.includes("Connection accepted!")) {
                  aggregatedMessage = `${newCount} connections accepted!`;
               } else {
                  aggregatedMessage = `${message} (x${newCount})`;
               }

               const filtered = prev.filter((_, idx) => idx !== matchIndex);
               return [...filtered, { id, message: aggregatedMessage, type, baseMessage: message, count: newCount }];
            }

            return [...prev, { id, message, type, baseMessage: message, count: 1 }];
         });
      }
   }, []);

   const dismiss = useCallback((id) => {
      setToasts((prev) => {
         const target = prev.find((t) => t.id === id);
         if (target && target.type === "message") {
            messageStreamRef.current = [];
         }
         return prev.filter((t) => t.id !== id);
      });
   }, []);

   return (
      <ToastContext.Provider value={toast}>
         <style>{styleSheet}</style>
         {children}
         <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </ToastContext.Provider>
   );
}

function ToastContainer({ toasts, onDismiss }) {
   if (toasts.length === 0) return null;

   return (
      <div
         style={{
            position: "fixed",
            top: "68px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            pointerEvents: "none",
            width: "100%",
            maxWidth: "480px",
            padding: "0.75rem",
         }}
      >
         {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={onDismiss} />
         ))}
      </div>
   );
}

function Toast({ toast, onDismiss }) {
   const { id, message, type } = toast;
   const isError = type === "error";
   const isMessage = type === "message";
   const duration = isMessage ? 8000 : 4000;

   useEffect(() => {
      const timer = setTimeout(() => {
         onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
   }, [id, duration, onDismiss]);

   return (
      <div
         style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            background: isError ? "#9b2335" : isMessage ? "var(--dark, #2b2d42)" : "var(--dark, #2b2d42)",
            color: "var(--cream, #f4f1de)",
            padding: "0.85rem 1.25rem",
            paddingBottom: isMessage ? "1.1rem" : "0.85rem",
            borderRadius: "6px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.88rem",
            fontWeight: 400,
            width: "100%",
            maxWidth: "400px",
            lineHeight: 1.45,
            pointerEvents: "all",
            animation: "wp-toast-slide-down 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            overflow: "hidden",
            border: isMessage ? "1px solid rgba(231, 111, 81, 0.25)" : "none",
         }}
      >
         <span style={{ flexShrink: 0, marginTop: "2px", display: "inline-flex" }}>
            {isMessage ? (
               <MessageSquare size={16} strokeWidth={2.5} style={{ color: "var(--warm, #e76f51)" }} />
            ) : isError ? (
               <X size={16} strokeWidth={2.5} />
            ) : (
               <Check size={16} strokeWidth={2.5} />
            )}
         </span>
         <span style={{ flex: 1, paddingRight: "0.5rem" }}>{message}</span>
         <button
            onClick={() => onDismiss(id)}
            aria-label="Dismiss"
            style={{
               background: "none",
               border: "none",
               color: "rgba(242,233,228,0.55)",
               cursor: "pointer",
               padding: 0,
               flexShrink: 0,
               lineHeight: 1,
               marginTop: "2px",
               display: "inline-flex",
               transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--cream, #f4f1de)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(242,233,228,0.55)"; }}
         >
            <X size={14} strokeWidth={2} />
         </button>
         {isMessage && (
            <div
               style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: "3.5px",
                  background: "var(--warm, #e76f51)",
                  animation: `wp-toast-progress 8000ms linear forwards`,
               }}
            />
         )}
      </div>
   );
}

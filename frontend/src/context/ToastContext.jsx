import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

export function useToast() {
   return useContext(ToastContext);
}

export function ToastProvider({ children }) {
   const [toasts, setToasts] = useState([]);
   const idRef = useRef(0);

   const toast = useCallback((message, type = "success") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
         setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
   }, []);

   const dismiss = useCallback((id) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
   }, []);

   return (
      <ToastContext.Provider value={toast}>
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
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            pointerEvents: "none",
         }}
      >
         {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={onDismiss} />
         ))}
      </div>
   );
}

function Toast({ toast, onDismiss }) {
   const isError = toast.type === "error";

   return (
      <div
         style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.65rem",
            background: isError ? "#9b2335" : "var(--dark)",
            color: "var(--cream)",
            padding: "0.75rem 1rem",
            borderRadius: "4px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.85rem",
            fontWeight: 400,
            maxWidth: "340px",
            lineHeight: 1.45,
            pointerEvents: "all",
            animation: "wp-toast-in 0.2s ease",
         }}
      >
         <span style={{ fontSize: "0.9rem", flexShrink: 0, marginTop: "1px" }}>
            {isError ? "✕" : "✓"}
         </span>
         <span style={{ flex: 1 }}>{toast.message}</span>
         <button
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
            style={{
               background: "none",
               border: "none",
               color: "rgba(242,233,228,0.55)",
               cursor: "pointer",
               fontSize: "0.9rem",
               padding: 0,
               flexShrink: 0,
               lineHeight: 1,
               marginTop: "1px",
            }}
         >
            ×
         </button>
      </div>
   );
}

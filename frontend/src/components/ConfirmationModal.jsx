import React, { useRef, useEffect } from 'react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isDanger = false,
  isLoading = false
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocusedElement = document.activeElement;

    // Trap focus logic
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      // Put focus on the primary confirm button by default, or cancel button
      focusableElements[focusableElements.length - 1].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!focusableElements || focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusedElement) {
        previousFocusedElement.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
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
      zIndex: 2000,
      padding: '1rem'
    }}>
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="app-card" 
        style={{ maxWidth: '400px', width: '100%', padding: '1.5rem' }}
      >
        <h3 id="confirm-modal-title" style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--dark)' }}>{title}</h3>
        <p style={{ fontSize: '0.88rem', color: '#5a5550', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={onClose}
            className="btn-ghost"
            style={{ flex: 1, padding: '0.75rem' }}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="btn-primary"
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              background: isDanger ? '#d9534f' : 'var(--warm)', 
              borderColor: isDanger ? '#d9534f' : 'var(--warm)', 
              fontWeight: 600,
              color: '#fff'
            }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

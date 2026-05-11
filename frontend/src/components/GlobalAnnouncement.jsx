import { useState, useEffect } from "react";

/**
 * GlobalAnnouncement Component
 * 
 * Displays a dismissible banner at the top of the page.
 * Uses localStorage to remember if a specific announcement has been dismissed.
 * 
 * @param {Object} props
 * @param {string} props.id - Unique ID for the announcement (used for dismissal persistence)
 * @param {string} props.message - The text to display
 * @param {string} props.type - Type of announcement: 'info', 'success', 'warning', 'error'
 * @param {string} props.link - Optional link for the announcement
 * @param {string} props.linkText - Text for the optional link
 */
export default function GlobalAnnouncement({ id, message, type = "info", link, linkText }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    const dismissed = localStorage.getItem(`announcement_dismissed_${id}`);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [id]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`announcement_dismissed_${id}`, "true");
  };

  if (!isVisible) return null;

  const bgColors = {
    info: "#386641", // Using theme dark green
    success: "#6a994e", // Using theme mid green
    warning: "#f4a261", // Using theme warm light
    error: "#e76f51", // Using theme warm coral
  };

  const bannerStyle = {
    background: bgColors[type] || bgColors.info,
    color: "#fff",
    padding: "0.6rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 1000,
    fontSize: "0.85rem",
    fontFamily: "var(--font-sans)",
    textAlign: "center",
    letterSpacing: "0.01em",
  };

  const closeButtonStyle = {
    position: "absolute",
    right: "1rem",
    background: "none",
    border: "none",
    color: "rgba(255, 255, 255, 0.8)",
    cursor: "pointer",
    fontSize: "1.2rem",
    lineHeight: 1,
    padding: "0.2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={bannerStyle}>
      <span>
        {message}
        {link && (
          <a 
            href={link} 
            style={{ 
              color: "#fff", 
              textDecoration: "underline", 
              marginLeft: "0.5rem",
              fontWeight: 500
            }}
          >
            {linkText || "Learn more"}
          </a>
        )}
      </span>
      <button 
        onClick={handleDismiss} 
        style={closeButtonStyle}
        aria-label="Dismiss announcement"
      >
        ×
      </button>
    </div>
  );
}

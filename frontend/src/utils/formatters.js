/**
 * Splits a single "Full Name" string into first_name / last_name on the first space.
 * Returns null for any part that's missing so the backend can store NULLs cleanly.
 * @param {string} name
 * @returns {{ first_name: string|null, last_name: string|null }}
 */
export function splitFullName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return { first_name: null, last_name: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: null };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

/**
 * Formats an ISO date string as a relative time label (e.g., "5m ago", "2h ago", "1d ago")
 * @param {string} isoString
 * @returns {string}
 */
export function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

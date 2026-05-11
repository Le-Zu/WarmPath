// Lightweight in-memory sliding-window rate limiter.
//
// State lives in this module's Map, so it resets on server restart. Good
// enough for spam prevention against individual users; for cross-instance
// limits (multi-node deployments) swap for Redis later.

type Bucket = number[]; // request timestamps in ms

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs?: number;
}

export function checkRateLimit(
  userId: string,
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const id = `${userId}:${key}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  const recent = (buckets.get(id) || []).filter((t) => t > cutoff);

  if (recent.length >= max) {
    const oldest = recent[0];
    return { ok: false, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }

  recent.push(now);
  buckets.set(id, recent);
  return { ok: true };
}

// Formats a retry-after duration as a human-friendly "in N minutes" / "in N seconds".
export function describeRetryAfter(retryAfterMs: number): string {
  const seconds = Math.ceil(retryAfterMs / 1000);
  if (seconds < 60) return `in ${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

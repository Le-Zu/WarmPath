// Tracks in-flight API requests so the UI can show a cold-start overlay.
// Render's free tier sleeps after ~15 min of inactivity and takes ~50s to
// wake. Without feedback the app looks frozen during that window.
//
// Behavior:
//   - Any request that exceeds COLD_START_THRESHOLD_MS flips `slow` to true.
//   - Once any request returns (with or without an HTTP error), the server
//     is marked warm and subsequent slow requests no longer trigger the
//     overlay (cold start can't recur within a session).
//   - When all in-flight requests finish, `slow` resets to false.

const COLD_START_THRESHOLD_MS = 4000;

let slow = false;
let serverIsWarm = false;
const pendingTimers = new Map();
const listeners = new Set();
let nextId = 0;

function emit() {
  for (const fn of listeners) fn(slow);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isSlow() {
  return slow;
}

export function startRequest() {
  const id = ++nextId;
  if (!serverIsWarm) {
    const timer = setTimeout(() => {
      pendingTimers.delete(id);
      if (!serverIsWarm && !slow) {
        slow = true;
        emit();
      }
    }, COLD_START_THRESHOLD_MS);
    pendingTimers.set(id, timer);
  }
  return id;
}

// Called when a request finishes. `gotResponse` should be true for any HTTP
// response (including 4xx/5xx) and false only for network failures.
export function endRequest(id, gotResponse) {
  const timer = pendingTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    pendingTimers.delete(id);
  }
  if (gotResponse && !serverIsWarm) {
    serverIsWarm = true;
  }
  if (slow && pendingTimers.size === 0) {
    slow = false;
    emit();
  }
}

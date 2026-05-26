const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 10000;

function normalizeAttempt(attempt: number): number {
  return Number.isFinite(attempt) && attempt > 0 ? Math.floor(attempt) : 0;
}

export function getLiveWebSocketReconnectDelay(attempt: number): number {
  const normalizedAttempt = normalizeAttempt(attempt);
  return Math.min(INITIAL_RECONNECT_DELAY * 2 ** normalizedAttempt, MAX_RECONNECT_DELAY);
}

export function getNextLiveWebSocketReconnectAttempt(attempt: number): number {
  return normalizeAttempt(attempt) + 1;
}

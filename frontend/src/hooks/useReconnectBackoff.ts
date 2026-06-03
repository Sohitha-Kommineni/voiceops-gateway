export function nextReconnectDelay(attempt: number): number {
  return Math.min(15000, 500 * 2 ** attempt);
}

export function useReconnectBackoff() {
  return { nextDelay: nextReconnectDelay };
}

/**
 * Tiny event bus so user actions can ping the ActivityFeed to refresh
 * immediately (instead of waiting up to 15s for the next poll).
 */
const EVT = "ccm-activity-refresh";

export function pingActivityFeed(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT));
}

export function onActivityPing(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const wrapped = () => handler();
  window.addEventListener(EVT, wrapped);
  return () => window.removeEventListener(EVT, wrapped);
}

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = 10;

type ChatLimitStore = {
  requestsByIp: Map<string, number[]>;
  lastPrunedAt: number;
};

const globalForChat = globalThis as typeof globalThis & {
  __healthTrackerChatLimitStore?: ChatLimitStore;
};

const store: ChatLimitStore = (globalForChat.__healthTrackerChatLimitStore ??= {
  requestsByIp: new Map(),
  lastPrunedAt: 0,
});

function prune(now: number) {
  if (now - store.lastPrunedAt < 60_000) return;
  store.lastPrunedAt = now;
  for (const [ip, timestamps] of store.requestsByIp) {
    const recent = timestamps.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
    if (recent.length) store.requestsByIp.set(ip, recent);
    else store.requestsByIp.delete(ip);
  }
}

/** Short-lived per-process burst guard; the account quota is persisted in Firestore. */
export function consumeIpRateLimit(ip: string): boolean {
  const now = Date.now();
  prune(now);

  const ipRequests = store.requestsByIp.get(ip) ?? [];
  if (ipRequests.length >= RATE_LIMIT_PER_WINDOW) return false;

  ipRequests.push(now);
  store.requestsByIp.set(ip, ipRequests);
  return true;
}

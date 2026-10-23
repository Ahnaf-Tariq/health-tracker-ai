const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = 10;
const SESSION_MESSAGE_LIMIT = 20;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

type SessionBudget = { count: number; touchedAt: number };
type ChatLimitStore = {
  requestsByIp: Map<string, number[]>;
  sessions: Map<string, SessionBudget>;
  lastPrunedAt: number;
};

const globalForChat = globalThis as typeof globalThis & {
  __healthTrackerChatLimitStore?: ChatLimitStore;
};

const store: ChatLimitStore = (globalForChat.__healthTrackerChatLimitStore ??= {
  requestsByIp: new Map(),
  sessions: new Map(),
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
  for (const [key, session] of store.sessions) {
    if (now - session.touchedAt > SESSION_TTL_MS) store.sessions.delete(key);
  }
}

/** Stores only short-lived IP request timestamps and per-session message counts. */
export function consumeChatAllowance(ip: string, sessionId: string):
  | { ok: true; remaining: number }
  | { ok: false; reason: "rate" | "session" } {
  const now = Date.now();
  prune(now);

  const ipRequests = store.requestsByIp.get(ip) ?? [];
  if (ipRequests.length >= RATE_LIMIT_PER_WINDOW) return { ok: false, reason: "rate" };

  const sessionKey = `${ip}:${sessionId}`;
  const session = store.sessions.get(sessionKey) ?? { count: 0, touchedAt: now };
  if (session.count >= SESSION_MESSAGE_LIMIT) return { ok: false, reason: "session" };

  ipRequests.push(now);
  store.requestsByIp.set(ip, ipRequests);
  session.count += 1;
  session.touchedAt = now;
  store.sessions.set(sessionKey, session);
  return { ok: true, remaining: SESSION_MESSAGE_LIMIT - session.count };
}

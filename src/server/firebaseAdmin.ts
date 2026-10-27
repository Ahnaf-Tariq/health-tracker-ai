import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const CHAT_MESSAGE_LIMIT = 10;
const CHAT_WINDOW_MS = 5 * 60 * 60 * 1000;

function adminApp() {
  const existing = getApps().find((app) => app.name === "health-tracker-admin");
  if (existing) return existing;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  if (!projectId || !clientEmail || !privateKey)
    throw new Error("Firebase Admin credentials are not configured.");
  return initializeApp(
    { credential: cert({ projectId, clientEmail, privateKey }) },
    "health-tracker-admin",
  );
}

export async function verifyFirebaseToken(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  return await getAuth(adminApp())
    .verifyIdToken(token, true)
    .catch(() => null);
}

function timestampMillis(value: unknown): number | undefined {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  return undefined;
}

/** Atomically reserves one of the signed-in user's messages across all chats. */
export async function consumeUserChatAllowance(user: {
  uid: string;
  name?: string;
  email?: string;
}): Promise<
  | { ok: true; chatsLeft: number; restoreTime: number }
  | { ok: false; chatsLeft: 0; restoreTime: number }
> {
  const database = getFirestore(adminApp());
  const userRef = database.doc(`users/${user.uid}`);
  const now = Date.now();

  return database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const data = snapshot.data() ?? {};
    const savedRestoreTime = timestampMillis(data.restore_time);
    const isActiveWindow =
      savedRestoreTime !== undefined && savedRestoreTime > now;
    const restoreTime = isActiveWindow
      ? savedRestoreTime
      : now + CHAT_WINDOW_MS;
    const savedChatsLeft = data.chats_left;
    const chatsLeft =
      isActiveWindow &&
      Number.isInteger(savedChatsLeft) &&
      savedChatsLeft >= 0 &&
      savedChatsLeft <= CHAT_MESSAGE_LIMIT
        ? savedChatsLeft
        : CHAT_MESSAGE_LIMIT;

    if (chatsLeft === 0) {
      return { ok: false, chatsLeft: 0, restoreTime };
    }

    const nextChatsLeft = chatsLeft - 1;
    transaction.set(
      userRef,
      {
        name:
          (typeof data.displayName === "string" && data.displayName) ||
          (typeof data.name === "string" && data.name) ||
          user.name ||
          "",
        email: user.email || data.email || "",
        chats_left: nextChatsLeft,
        restore_time: Timestamp.fromMillis(restoreTime),
        chat_limit_updated_at: Timestamp.fromMillis(now),
      },
      { merge: true },
    );

    return { ok: true, chatsLeft: nextChatsLeft, restoreTime };
  });
}

/** Read the authoritative allowance for an authenticated account. */
export async function getUserChatUsage(uid: string) {
  const database = getFirestore(adminApp());
  const snapshot = await database.doc(`users/${uid}`).get();
  const data = snapshot.data() ?? {};
  const restoreTime = timestampMillis(data.restore_time);
  const savedChatsLeft = data.chats_left;

  if (restoreTime === undefined || restoreTime <= Date.now()) {
    return { chatsLeft: CHAT_MESSAGE_LIMIT, restoreTime: null };
  }

  return {
    chatsLeft:
      Number.isInteger(savedChatsLeft) && savedChatsLeft >= 0 && savedChatsLeft <= CHAT_MESSAGE_LIMIT
        ? savedChatsLeft
        : CHAT_MESSAGE_LIMIT,
    restoreTime,
  };
}

export async function loadConversation(uid: string, conversationId: string) {
  const database = getFirestore(adminApp());
  const conversation = await database
    .doc(`users/${uid}/conversations/${conversationId}`)
    .get();
  if (!conversation.exists) return undefined;
  const messages = await database
    .collection(`users/${uid}/conversations/${conversationId}/messages`)
    .orderBy("createdAt", "asc")
    .limitToLast(40)
    .get();
  return {
    context: conversation.data()?.context ?? null,
    messages: messages.docs.map((item) => ({
      role: item.get("role"),
      content: item.get("content"),
    })),
  };
}

/** Delete a conversation document and every nested message document. */
export async function deleteConversation(uid: string, conversationId: string) {
  const database = getFirestore(adminApp());
  const conversationRef = database.doc(
    `users/${uid}/conversations/${conversationId}`,
  );
  // Recursive deletion is idempotent and also cleans up any descendants left
  // behind by an interrupted earlier attempt. Avoid an extra document read.
  await database.recursiveDelete(conversationRef);
  return true;
}

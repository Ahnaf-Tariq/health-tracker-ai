import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

export type ChatRole = "user" | "assistant";
export type StoredMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: unknown;
};
export type ChatContext = {
  answers: Record<string, unknown>;
  report: Record<string, unknown>;
} | null;
export type Conversation = {
  id: string;
  title: string;
  source: "report" | "general";
  context: ChatContext;
  createdAt?: unknown;
  updatedAt?: unknown;
};
export type ChatUsage = {
  chatsLeft: number;
  restoreTime: number | null;
  updatedAt: number | null;
};
const conversationCollection = (uid: string) =>
  collection(getFirebaseDb(), "users", uid, "conversations");
const messageCollection = (uid: string, id: string) =>
  collection(getFirebaseDb(), "users", uid, "conversations", id, "messages");

function timestampMillis(value: unknown): number | null {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  )
    return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

export function watchChatUsage(
  uid: string,
  onValue: (usage: ChatUsage) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    doc(getFirebaseDb(), "users", uid),
    (snapshot) => {
      const data = snapshot.data();
      const chatsLeft = data?.chats_left;
      onValue({
        chatsLeft:
          Number.isInteger(chatsLeft) && chatsLeft >= 0 && chatsLeft <= 10
            ? chatsLeft
            : 10,
        restoreTime: timestampMillis(data?.restore_time),
        updatedAt: timestampMillis(data?.chat_limit_updated_at),
      });
    },
    onError,
  );
}

function conversationFrom(id: string, data: DocumentData): Conversation {
  return {
    id,
    title: typeof data.title === "string" ? data.title : "New conversation",
    source: data.source === "report" ? "report" : "general",
    context: data.context ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createConversation(
  uid: string,
  source: "report" | "general",
  context: ChatContext,
) {
  const initial: Omit<Conversation, "id"> = {
    title:
      source === "report" ? "Check-in conversation" : "General wellness chat",
    source,
    context,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(conversationCollection(uid), initial);
  return ref.id;
}

/** Allocate a stable ID and begin persistence without waiting for the network. */
export function beginConversation(
  uid: string,
  source: "report" | "general",
  context: ChatContext,
) {
  const initial: Omit<Conversation, "id"> = {
    title:
      source === "report" ? "Check-in conversation" : "General wellness chat",
    source,
    context,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = doc(conversationCollection(uid));
  return { id: ref.id, persisted: setDoc(ref, initial) };
}

export async function listConversations(uid: string) {
  const result = await getDocs(
    query(
      conversationCollection(uid),
      orderBy("updatedAt", "desc"),
      limit(100),
    ),
  );
  return result.docs.map((snapshot) =>
    conversationFrom(snapshot.id, snapshot.data()),
  );
}

export async function getConversation(uid: string, id: string) {
  const result = await getDoc(
    doc(getFirebaseDb(), "users", uid, "conversations", id),
  );
  return result.exists() ? conversationFrom(result.id, result.data()) : null;
}

export async function renameConversation(
  uid: string,
  id: string,
  title: string,
) {
  const normalizedTitle = title.trim();
  if (!normalizedTitle || normalizedTitle.length > 100) {
    throw new Error("Chat titles must be between 1 and 100 characters.");
  }

  await updateDoc(
    doc(getFirebaseDb(), "users", uid, "conversations", id),
    { title: normalizedTitle, updatedAt: serverTimestamp() },
  );
}

export async function listMessages(
  uid: string,
  id: string,
): Promise<StoredMessage[]> {
  const result = await getDocs(
    query(
      messageCollection(uid, id),
      orderBy("createdAt", "asc"),
      limitToLast(100),
    ),
  );
  return result.docs.map((snapshot) => ({
    id: snapshot.id,
    ...(snapshot.data() as Omit<StoredMessage, "id">),
  }));
}

export async function saveMessage(
  uid: string,
  conversationId: string,
  message: StoredMessage,
) {
  const database = getFirebaseDb();
  const conversationRef = doc(
    database,
    "users",
    uid,
    "conversations",
    conversationId,
  );
  const messageRef = doc(
    database,
    "users",
    uid,
    "conversations",
    conversationId,
    "messages",
    message.id,
  );

  await runTransaction(database, async (transaction) => {
    const conversation = await transaction.get(conversationRef);
    const currentTitle = conversation.data()?.title;
    const canGenerateTitle =
      message.role === "user" &&
      (!currentTitle ||
        currentTitle === "Check-in conversation" ||
        currentTitle === "General wellness chat" ||
        currentTitle === "New conversation");

    transaction.set(messageRef, {
      role: message.role,
      content: message.content,
      createdAt: serverTimestamp(),
    });
    transaction.set(
      conversationRef,
      {
        ...(canGenerateTitle ? { title: message.content.slice(0, 72) } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}

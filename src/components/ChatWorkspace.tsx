"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useAuth, useCheckInSession } from "./AppProviders";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import {
  beginConversation,
  createConversation,
  getConversation,
  listConversations,
  listMessages,
  renameConversation,
  type Conversation,
} from "../lib/chatStore";
import { createSafeChatContext } from "../domain/chatContext";
import type { WellnessReport } from "../domain/types";
import { ChatGuide } from "./ChatGuide";
import { ConfirmationModal } from "./ConfirmationModal";

export function ChatLobby() {
  const { user, authReady } = useAuth();
  const { report } = useCheckInSession();
  const router = useRouter();
  const [items, setItems] = useState<Conversation[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [chatToDelete, setChatToDelete] = useState<Conversation | null>(null);
  const [chatToRename, setChatToRename] = useState<Conversation | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameError, setRenameError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [renamingId, setRenamingId] = useState("");
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/chat")}`);
      return;
    }
    void listConversations(user.uid)
      .then(setItems)
      .catch(() =>
        setError(
          "Chat history could not be loaded. Check your Firestore rules and try again.",
        ),
      )
      .finally(() => setBusy(false));
  }, [authReady, user, router]);
  async function create(source: "report" | "general") {
    if (!user) return;
    if (source === "report" && !report) {
      setError("Complete a check-in first to start a report-based chat.");
      return;
    }
    try {
      const id = await createConversation(
        user.uid,
        source,
        source === "report" && report ? createSafeChatContext(report) : null,
      );
      router.push(`/chat/${id}`);
    } catch {
      setError(
        "A new chat could not be created. Check your Firestore rules and try again.",
      );
    }
  }
  async function deleteSelectedChat() {
    if (!user || !chatToDelete || deletingId) return;
    const conversation = chatToDelete;
    setItems((current) =>
      current.filter((item) => item.id !== conversation.id),
    );
    setChatToDelete(null);
    setDeletingId(conversation.id);
    setError("");
    setStatus("Deleting chat and saved messages…");
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `/api/chat/${encodeURIComponent(conversation.id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(
          result.error || "The conversation could not be deleted.",
        );
      }
      setStatus("Chat and saved messages deleted.");
    } catch (caught) {
      const latest = await listConversations(user.uid).catch(() => null);
      if (latest) {
        setItems(latest);
      } else {
        setItems((current) =>
          current.some((item) => item.id === conversation.id)
            ? current
            : [conversation, ...current],
        );
      }
      setStatus("");
      setError(
        caught instanceof Error
          ? caught.message
          : "The conversation could not be deleted. Please try again.",
      );
    } finally {
      setDeletingId("");
    }
  }
  async function renameSelectedChat() {
    if (!user || !chatToRename || renamingId) return;
    const conversation = chatToRename;
    const title = renameTitle.trim();
    if (!title || title.length > 100) {
      setRenameError("Enter a title between 1 and 100 characters.");
      return;
    }
    setRenamingId(conversation.id);
    setRenameError("");
    try {
      await renameConversation(user.uid, conversation.id, title);
      setItems((current) => [
        { ...conversation, title },
        ...current.filter((item) => item.id !== conversation.id),
      ]);
      setChatToRename(null);
      setStatus("Chat title updated.");
    } catch {
      setRenameError(
        "The chat title could not be updated. Check your connection and try again.",
      );
    } finally {
      setRenamingId("");
    }
  }
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-[calc(100%_-_32px)] max-w-[1040px] flex-1 py-10 sm:w-[calc(100%_-_64px)] sm:py-14">
        <span className="text-[10px] font-bold tracking-[.15em] text-teal">
          YOUR WELLNESS GUIDE
        </span>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="m-0 font-display text-[42px] font-normal tracking-[-.04em]">
              Your conversations
            </h1>
            <p className="mb-0 mt-2 text-[13px] text-muted">
              Continue a saved chat or begin a new conversation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void create("report")}
              disabled={!report}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal px-4 text-[12px] font-semibold text-white hover:bg-teal-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={16} />
              New chat with report
            </button>
            <button
              onClick={() => void create("general")}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-panel px-4 text-[12px] font-semibold hover:border-teal"
            >
              <Plus size={16} />
              New general chat
            </button>
          </div>
        </div>
        {!report && (
          <p className="mt-4 text-[11px] text-muted">
            To attach a report, complete a check-in first. General chats are
            available any time.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-amber-bg p-4 text-[12px] text-amber"
          >
            {error}
          </p>
        )}
        {status && (
          <p role="status" className="mt-4 text-[12px] text-muted">
            {status}
          </p>
        )}
        <section className="mt-8 rounded-2xl border border-line bg-panel p-5 shadow-panel sm:p-7">
          <h2 className="mb-4 mt-0 font-display text-[26px] font-normal">
            Recent chats
          </h2>
          {busy ? (
            <div
              className="grid gap-2"
              role="status"
              aria-label="Loading your chat history"
            >
              <span className="sr-only">Loading your chat history</span>
              {["first", "second", "third"].map((row) => (
                <div
                  key={row}
                  aria-hidden="true"
                  className="flex min-h-[76px] animate-pulse items-center gap-4 rounded-xl border border-line bg-paper/50 p-4"
                >
                  <span className="size-10 shrink-0 rounded-xl bg-line/70" />
                  <span className="grid flex-1 gap-2">
                    <span className="h-3 w-2/5 rounded-full bg-line/70" />
                    <span className="h-2.5 w-1/4 rounded-full bg-line/50" />
                  </span>
                  <span className="h-2.5 w-8 rounded-full bg-line/50" />
                </div>
              ))}
            </div>
          ) : items.length ? (
            <ul className="m-0 grid list-none gap-2 p-0">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-line bg-paper/50 p-2 transition hover:border-teal"
                >
                  <Link
                    href={`/chat/${item.id}`}
                    className="flex min-h-[60px] min-w-0 flex-1 items-center gap-4 rounded-lg px-2 py-2 no-underline"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-tint text-teal">
                      <MessageCircle size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[13px] font-semibold text-ink">
                        {item.title}
                      </strong>
                      <small className="mt-1 block text-[10px] text-muted">
                        {item.source === "report"
                          ? "Based on your check-in"
                          : "General wellness chat"}
                      </small>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setChatToRename(item);
                      setRenameTitle(item.title);
                      setRenameError("");
                    }}
                    disabled={Boolean(deletingId || renamingId)}
                    aria-label={`Rename ${item.title}`}
                    title="Rename conversation"
                    className="grid size-10 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-teal-tint hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:opacity-50"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatToDelete(item)}
                    disabled={Boolean(deletingId || renamingId)}
                    aria-label={`Delete ${item.title}`}
                    title="Delete conversation"
                    className="grid size-10 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:opacity-50"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl bg-paper p-7 text-center">
              <MessageCircle className="mx-auto text-teal" />
              <p className="mb-0 mt-3 text-[12px] text-muted">
                Your saved conversations will appear here.
              </p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter compact />
      <ConfirmationModal
        open={Boolean(chatToDelete)}
        title="Delete this chat?"
        message={`“${chatToDelete?.title || "This conversation"}” and all its saved messages will be permanently deleted.`}
        confirmLabel="Delete chat"
        busyLabel="Deleting…"
        icon={<Trash2 size={18} aria-hidden="true" />}
        confirmVariant="danger"
        busy={Boolean(deletingId)}
        onClose={() => setChatToDelete(null)}
        onConfirm={deleteSelectedChat}
      />
      <ConfirmationModal
        open={Boolean(chatToRename)}
        title="Rename this chat"
        message="Choose a title that will appear in your saved conversations."
        confirmLabel="Save title"
        busyLabel="Savingâ€¦"
        icon={<Pencil size={18} aria-hidden="true" />}
        confirmVariant="primary"
        confirmDisabled={
          !renameTitle.trim() || renameTitle.trim() === chatToRename?.title
        }
        busy={Boolean(renamingId)}
        errorMessage={renameError}
        onClose={() => setChatToRename(null)}
        onConfirm={renameSelectedChat}
      >
        <label
          className="block text-[12px] font-medium text-ink"
          htmlFor="rename-chat-title"
        >
          Chat title
        </label>
        <input
          id="rename-chat-title"
          type="text"
          value={renameTitle}
          maxLength={100}
          autoFocus
          onChange={(event) => setRenameTitle(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void renameSelectedChat();
            }
          }}
          placeholder="Enter a chat title"
          className="mt-1 h-11 w-full rounded-lg border border-line bg-paper px-3 text-[13px] text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
        />
        <p className="mb-0 mt-1.5 text-right text-[10px] text-muted">
          {renameTitle.length}/100
        </p>
      </ConfirmationModal>
    </div>
  );
}

export function NewChatRedirect() {
  const { user, authReady } = useAuth();
  const { report } = useCheckInSession();
  const router = useRouter();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(
        `/login?next=${encodeURIComponent(`/chat/new${window.location.search}`)}`,
      );
      return;
    }
    if (started.current) return;
    started.current = true;
    const source =
      new URLSearchParams(window.location.search).get("source") === "report" &&
      report
        ? "report"
        : "general";
    let alive = true;
    try {
      const { id, persisted } = beginConversation(
        user.uid,
        source,
        source === "report" && report ? createSafeChatContext(report) : null,
      );
      if (alive)
        router.replace(`/chat/${id}?source=${source}`, { scroll: false });
      // Firestore can keep a write pending while it waits for a network
      // acknowledgement. Start it here, but never hold navigation on it.
      void persisted.catch(() => {});
    } catch {
      setError("Could not start a chat. Please refresh and try again.");
    }
    return () => {
      alive = false;
    };
  }, [authReady, user, report, router, retry]);
  return (
    <main className="mx-auto min-h-[65vh] max-w-[760px] px-6 py-20 text-center">
      <Sparkles className="mx-auto text-teal" />
      <h1 className="font-display text-3xl font-normal">
        Preparing your chat…
      </h1>
      <p className="text-[13px] text-muted">
        {error || "Your conversation is being set up."}
      </p>
      {error && (
        <button
          type="button"
          onClick={() => {
            started.current = false;
            setError("");
            setRetry((value) => value + 1);
          }}
          className="mt-3 rounded-lg bg-teal px-4 py-2 text-[12px] font-semibold text-white"
        >
          Try again
        </button>
      )}
    </main>
  );
}

export function ConversationPage({
  id,
  initialSource = "general",
}: {
  id: string;
  initialSource?: "report" | "general";
}) {
  const { user, authReady } = useAuth();
  const { report: currentReport } = useCheckInSession();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation>(() => ({
    id,
    title:
      initialSource === "report" ? "Check-in conversation" : "New conversation",
    source: initialSource,
    context:
      initialSource === "report" && currentReport
        ? createSafeChatContext(currentReport)
        : null,
  }));
  const [messages, setMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string }[]
  >([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyRetry, setHistoryRetry] = useState(0);
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/chat/${id}`)}`);
      return;
    }
    let alive = true;
    const source =
      new URLSearchParams(window.location.search).get("source") === "report" ||
      initialSource === "report"
        ? "report"
        : "general";
    const optimisticConversation: Conversation = {
      id,
      title:
        source === "report" ? "Check-in conversation" : "General wellness chat",
      source,
      context:
        source === "report" && currentReport
          ? createSafeChatContext(currentReport)
          : null,
    };
    setConversation(optimisticConversation);
    setHistoryReady(false);
    setHistoryError("");

    // Render the chat immediately, then hydrate saved history as Firestore
    // responds. A pending read must not block the entire page.
    void getConversation(user.uid, id)
      .then((chat) => {
        if (alive && chat) setConversation(chat);
      })
      .catch(() => {});
    void listMessages(user.uid, id)
      .then((history) => {
        if (!alive) return;
        setMessages(history);
        setHistoryReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setHistoryError(
          "Saved messages could not be loaded. Check your connection and try again.",
        );
      });
    return () => {
      alive = false;
    };
  }, [authReady, user, id, router, currentReport, historyRetry, initialSource]);
  const report = conversation.context?.report as unknown as
    | WellnessReport
    | undefined;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">
        <ChatGuide
          key={id}
          report={report ?? null}
          conversationId={id}
          initialMessages={messages}
          historyReady={historyReady}
          historyError={historyError}
          onRetryHistory={() => setHistoryRetry((value) => value + 1)}
          onBack={() => router.push("/chat")}
          onSupport={() => router.push("/check-in?support=1")}
        />
      </div>
      <SiteFooter compact />
    </div>
  );
}

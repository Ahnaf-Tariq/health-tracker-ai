"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  HeartPulse,
  Pause,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { WellnessReport } from "../domain/types";
import { formatMeasurement } from "../domain/format";
import { hasSelfHarmConcern } from "../domain/privacy";
import { getFirebaseAuth } from "../lib/firebase";
import { saveMessage, type ChatUsage } from "../lib/chatStore";
import { useAuth } from "./AppProviders";
import { useRouter } from "next/navigation";
import { createConversation } from "../lib/chatStore";
import { createSafeChatContext } from "../domain/chatContext";

type Message = { id: string; role: "user" | "assistant"; content: string };

interface Props {
  report: WellnessReport | null;
  conversationId: string;
  initialMessages: Message[];
  historyReady: boolean;
  historyError: string;
  onRetryHistory: () => void;
  onBack: () => void;
  onSupport: () => void;
}

const STARTER_PROMPTS = [
  "Can you explain my results in simple terms?",
  "What could I ask my doctor about feeling tired?",
  "What is one small habit I could try this week?",
];

function formatRemainingTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}h ${minutes}m ${remainder}s`
    : `${minutes}m ${remainder}s`;
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (body.error === "support_required") return "support_required";
    if (typeof body.error === "string") return body.error;
  } catch {
    // The server may return a non-JSON proxy error.
  }
  return "The AI guide could not respond just now. Please try again.";
}

async function fetchChatUsage(idToken: string): Promise<ChatUsage> {
  const response = await fetch("/api/chat/usage", {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    let serverMessage = "No error message was returned.";
    try {
      const errorBody = (await response.json()) as { error?: unknown };
      if (typeof errorBody.error === "string") serverMessage = errorBody.error;
    } catch {
      // Keep the status code if the server response wasn't JSON.
    }
    console.error("[chat/usage] Allowance request failed.", {
      status: response.status,
      statusText: response.statusText,
      message: serverMessage,
    });
    throw new Error(`Chat allowance request failed (${response.status}).`);
  }
  const data = (await response.json()) as {
    chats_left?: unknown;
    restore_time?: unknown;
  };
  const parsedRestoreTime =
    typeof data.restore_time === "string" ? Date.parse(data.restore_time) : NaN;
  if (
    !Number.isInteger(data.chats_left) ||
    (data.chats_left as number) < 0 ||
    (data.chats_left as number) > 10 ||
    (data.restore_time !== null && !Number.isFinite(parsedRestoreTime))
  ) {
    throw new Error("The server returned an invalid chat allowance.");
  }
  return {
    chatsLeft: data.chats_left as number,
    restoreTime: Number.isFinite(parsedRestoreTime) ? parsedRestoreTime : null,
    updatedAt: null,
  };
}

async function consumeEventStream(
  response: Response,
  onDelta: (text: string) => void,
) {
  if (!response.body)
    throw new Error("The response stream was unavailable. Please try again.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let receivedText = false;
  let streamError = "";

  function consumeBlock(block: string) {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!data) return;
    const event = JSON.parse(data) as {
      type?: string;
      text?: string;
      message?: string;
    };
    if (event.type === "delta" && event.text) {
      receivedText = true;
      onDelta(event.text);
    } else if (event.type === "error") {
      streamError =
        event.message ||
        "The AI guide could not finish this response. Please try again.";
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      consumeBlock(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
    if (done) break;
  }
  if (buffer.trim()) consumeBlock(buffer);
  if (streamError) throw new Error(streamError);
  if (!receivedText)
    throw new Error(
      "The AI guide returned an empty response. Please try again.",
    );
}

export function ChatGuide({
  report,
  conversationId,
  initialMessages,
  historyReady,
  historyError,
  onRetryHistory,
  onBack,
  onSupport,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryText, setRetryText] = useState("");
  const [usage, setUsage] = useState<ChatUsage>({
    chatsLeft: 10,
    restoreTime: null,
    updatedAt: null,
  });
  const [usageReady, setUsageReady] = useState(false);
  const [usageError, setUsageError] = useState("");
  const [usageRetry, setUsageRetry] = useState(0);
  const [clockNow, setClockNow] = useState(0);
  const [creatingChat, setCreatingChat] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottomRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const userMessageCount = messages.filter(
    (message) => message.role === "user",
  ).length;
  const remaining =
    usage.restoreTime !== null && clockNow >= usage.restoreTime
      ? 10
      : usage.chatsLeft;
  const restoreCountdown =
    usage.restoreTime !== null && clockNow < usage.restoreTime && remaining < 10
      ? formatRemainingTime(usage.restoreTime - clockNow)
      : "";

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refreshUsage = async () => {
      try {
        const idToken = await user.getIdToken();
        const nextUsage = await fetchChatUsage(idToken);
        if (active) {
          setUsage(nextUsage);
          setUsageError("");
          setUsageReady(true);
        }
      } catch {
        if (active) {
          setUsageError("We couldn’t load your saved message allowance. Please retry.");
          setUsageReady(false);
        }
      }
    };
    setUsageReady(false);
    setUsageError("");
    void refreshUsage();
    const interval = window.setInterval(refreshUsage, 60_000);
    window.addEventListener("focus", refreshUsage);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshUsage);
    };
  }, [user, usageRetry]);

  useEffect(() => {
    const updateClock = () => setClockNow(Date.now());
    updateClock();
    const timer = window.setInterval(updateClock, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (historyReady) setMessages(initialMessages);
  }, [conversationId, historyReady, initialMessages]);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (!conversation || !stickToBottomRef.current) return;

    // Keep scrolling local to the chat. scrollIntoView() can also move the
    // document viewport, which makes the whole page jump on send or pause.
    conversation.scrollTo({
      top: conversation.scrollHeight,
      behavior: loading ? "auto" : "smooth",
    });
  }, [messages, loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useLayoutEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;

    const maxHeight = 144;
    composer.style.height = "auto";
    const nextHeight = Math.min(composer.scrollHeight, maxHeight);
    composer.style.height = `${nextHeight}px`;
    composer.style.overflowY =
      composer.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [draft]);

  async function requestReply(history: Message[], userText: string) {
    if (sendingRef.current) return;
    const normalized = userText.trim();
    if (!normalized) return;
    if (hasSelfHarmConcern(normalized)) {
      onSupport();
      return;
    }
    if (normalized.length > 1_200) {
      setError("Please keep each message to 1,200 characters or fewer.");
      return;
    }
    if (!historyReady || !usageReady) {
      setError(
        "Your saved chat or message allowance is still loading. Please try again in a moment.",
      );
      return;
    }
    if (remaining <= 0) {
      setError(
        "You’ve used all 10 AI messages in this 5-hour window. Your allowance will restore automatically.",
      );
      return;
    }

    const updatedHistory =
      history.at(-1)?.role === "user" && history.at(-1)?.content === normalized
        ? history
        : [
            ...history,
            {
              id: crypto.randomUUID(),
              role: "user" as const,
              content: normalized,
            },
          ];
    const assistantId = crypto.randomUUID();
    stickToBottomRef.current = true;
    sendingRef.current = true;
    setMessages([
      ...updatedHistory,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setLoading(true);
    setError("");
    setNotice("");
    setRetryText("");
    const controller = new AbortController();
    abortRef.current = controller;

    let assistantText = "";
    try {
      if (!user)
        throw new Error("Please sign in again to continue this conversation.");
      await saveMessage(user.uid, conversationId, updatedHistory.at(-1)!);
      const idToken = await getFirebaseAuth().currentUser?.getIdToken();
      if (!idToken)
        throw new Error("Your sign-in expired. Please sign in again.");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ conversationId }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const message = await readError(response);
        void fetchChatUsage(idToken)
          .then((nextUsage) => {
            setUsage(nextUsage);
            setUsageReady(true);
            setUsageError("");
          })
          .catch(() => {});
        if (message === "support_required") {
          onSupport();
          return;
        }
        throw new Error(message);
      }

      const chatsLeft = Number(response.headers.get("X-Chat-Chats-Left"));
      const restoreTimeHeader = response.headers.get("X-Chat-Restore-Time");
      const restoreTime = restoreTimeHeader
        ? Date.parse(restoreTimeHeader)
        : NaN;
      if (Number.isInteger(chatsLeft) && chatsLeft >= 0 && chatsLeft <= 10) {
        setUsage({
          chatsLeft,
          restoreTime: Number.isFinite(restoreTime) ? restoreTime : null,
          updatedAt: Date.now(),
        });
        setUsageReady(true);
        setUsageError("");
      }

      await consumeEventStream(response, (text) => {
        assistantText += text;
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + text }
              : message,
          ),
        );
      });
      if (assistantText)
        await saveMessage(user.uid, conversationId, {
          id: assistantId,
          role: "assistant",
          content: assistantText,
        });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        if (user) {
          if (assistantText)
            void saveMessage(user.uid, conversationId, {
              id: assistantId,
              role: "assistant",
              content: assistantText,
            }).catch(() => {});
        }
        setMessages((current) =>
          current.filter(
            (message) => message.content || message.role !== "assistant",
          ),
        );
        return;
      }
      setMessages(updatedHistory);
      setRetryText(normalized);
      setError(
        caught instanceof Error
          ? caught.message
          : "The AI guide could not respond just now. Please try again.",
      );
    } finally {
      sendingRef.current = false;
      setLoading(false);
      abortRef.current = null;
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    void requestReply(messages, text);
  }

  function stopResponse() {
    if (!sendingRef.current) return;
    abortRef.current?.abort();
    setNotice("Response stopped. You can continue the conversation.");
  }

  async function newChat() {
    if (!user || creatingChat) return;
    setCreatingChat(true);
    try {
      const source = report ? "report" : "general";
      const id = await createConversation(
        user.uid,
        source,
        report ? createSafeChatContext(report) : null,
      );
      router.push(`/chat/${id}`);
    } catch {
      setError(
        "A new chat could not be created. Please check your connection and try again.",
      );
    } finally {
      setCreatingChat(false);
    }
  }

  return (
    <main
      className="mx-auto w-[calc(100%_-_32px)] max-w-[1160px] py-4 sm:w-[calc(100%_-_56px)]"
      aria-labelledby="chat-heading"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted transition hover:bg-teal-tint hover:text-teal focus-visible:outline-2 focus-visible:outline-teal"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Back to chats
        </button>
        <button
          type="button"
          onClick={() => void newChat()}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-xs font-medium text-muted transition hover:border-teal hover:text-teal disabled:opacity-50"
        >
          <Sparkles size={15} aria-hidden="true" />{" "}
          {creatingChat ? "Creating…" : "New chat"}
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-2xl border border-line bg-panel shadow-panel">
          <header className="flex items-start gap-4 border-b border-line bg-teal-tint/60 p-4 sm:p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal text-white shadow-sm">
              <Sparkles size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.13em] text-teal">
                YOUR WELLNESS GUIDE
              </span>
              <h1
                id="chat-heading"
                className="m-0 font-display text-[30px] font-normal leading-tight tracking-[-0.03em] text-ink sm:text-[36px]"
              >
                Let’s talk it through.
              </h1>
              <p className="mb-0 mt-2 max-w-[620px] text-[13px] leading-relaxed text-muted">
                Ask about your report, everyday habits, or how to prepare for a
                doctor visit.
              </p>
            </div>
          </header>

          <div
            ref={conversationRef}
            onScroll={(event) => {
              const element = event.currentTarget;
              const distanceFromBottom =
                element.scrollHeight - element.scrollTop - element.clientHeight;
              stickToBottomRef.current = distanceFromBottom < 72;
            }}
            className="flex min-h-[380px] max-h-[min(60vh,680px)] flex-col gap-4 overflow-y-auto p-4 sm:p-6"
            aria-label="Conversation"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" ? (
                  <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-line bg-paper px-4 py-3 text-[13px] leading-[1.7] text-ink sm:max-w-[82%] sm:px-5">
                    {message.content ? (
                      <p className="m-0 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-muted">
                        <span className="size-2 animate-pulse rounded-full bg-teal" />
                        <span className="size-2 animate-pulse rounded-full bg-teal [animation-delay:150ms]" />
                        <span className="size-2 animate-pulse rounded-full bg-teal [animation-delay:300ms]" />
                        <span className="sr-only">Writing a reply</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-teal px-4 py-3 text-[13px] leading-[1.7] text-white sm:max-w-[82%] sm:px-5">
                    <p className="m-0 whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}
              </div>
            ))}
            {!historyReady && !historyError ? (
              <div
                className="flex flex-col gap-4"
                role="status"
                aria-label="Loading your saved messages"
              >
                <span className="sr-only">Loading your saved messages</span>
                <div className="h-[72px] w-[78%] animate-pulse rounded-2xl rounded-tl-sm border border-line bg-paper px-4 py-3">
                  <div className="mb-2 h-2.5 w-[90%] rounded-full bg-line/70" />
                  <div className="h-2.5 w-[62%] rounded-full bg-line/70" />
                </div>
                <div className="ml-auto h-11 w-[32%] animate-pulse rounded-2xl rounded-tr-sm bg-teal/25" />
                <div className="h-[58px] w-[66%] animate-pulse rounded-2xl rounded-tl-sm border border-line bg-paper px-4 py-3">
                  <div className="mb-2 h-2.5 w-[86%] rounded-full bg-line/70" />
                  <div className="h-2.5 w-[48%] rounded-full bg-line/70" />
                </div>
              </div>
            ) : null}
          </div>

          {userMessageCount === 0 && !loading ? (
            <div className="flex flex-wrap gap-2 px-4 pb-4 sm:px-6">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void requestReply(messages, prompt)}
                  className="rounded-full border border-line bg-paper/60 px-3 py-2 text-left text-[11px] leading-relaxed text-muted transition hover:border-teal hover:bg-teal-tint hover:text-teal cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <div className="border-t border-line p-4 sm:p-6">
            {historyError ? (
              <div
                className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber/30 bg-amber-bg px-3 py-2.5 text-xs text-ink"
                role="alert"
              >
                <span>{historyError}</span>
                <button
                  type="button"
                  onClick={onRetryHistory}
                  className="font-semibold text-teal underline underline-offset-2"
                >
                  Reload messages
                </button>
              </div>
            ) : null}
            {usageError ? (
              <div
                className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber/30 bg-amber-bg px-3 py-2.5 text-xs text-ink"
                role="alert"
              >
                <span>{usageError}</span>
                <button
                  type="button"
                  onClick={() => setUsageRetry((retry) => retry + 1)}
                  className="font-semibold text-teal underline underline-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : null}
            {error ? (
              <div
                className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber/30 bg-amber-bg px-3 py-2.5 text-xs text-ink"
                role="alert"
              >
                <span>{error}</span>
                {retryText ? (
                  <button
                    type="button"
                    onClick={() => void requestReply(messages, retryText)}
                    disabled={loading || remaining === 0}
                    className="font-semibold text-teal underline underline-offset-2 disabled:opacity-50"
                  >
                    Try again
                  </button>
                ) : null}
              </div>
            ) : null}
            <form
              onSubmit={submit}
              className="flex items-end gap-2 rounded-xl border border-line bg-paper p-2 transition focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/15"
            >
              <label className="sr-only" htmlFor="chat-message">
                Your message
              </label>
              <textarea
                ref={composerRef}
                id="chat-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={1_200}
                rows={1}
                placeholder="Ask a question about your check-in…"
                disabled={
                  loading ||
                  !historyReady ||
                  Boolean(historyError) ||
                  !usageReady ||
                  remaining === 0
                }
                className="max-h-36 min-h-11 flex-1 resize-none overflow-y-hidden bg-transparent px-2 py-2 text-[13px] leading-relaxed text-ink outline-none placeholder:text-soft disabled:opacity-60"
              />
              {loading ? (
                <button
                  type="button"
                  onClick={stopResponse}
                  aria-label="Pause response"
                  title="Pause response"
                  className="grid size-11 shrink-0 place-items-center rounded-lg bg-teal text-white transition hover:bg-teal-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                >
                  <Pause size={18} fill="currentColor" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    !draft.trim() ||
                    !historyReady ||
                    Boolean(historyError) ||
                    !usageReady ||
                    remaining === 0
                  }
                  aria-label="Send message"
                  className="grid size-11 shrink-0 place-items-center rounded-lg bg-teal text-white transition hover:bg-teal-strong disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ArrowUp size={19} aria-hidden="true" />
                </button>
              )}
            </form>
            {notice ? (
              <p
                className="mb-0 mt-2 text-[11px] text-teal"
                role="status"
                aria-live="polite"
              >
                {notice}
              </p>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-soft">
              <span>Enter to send · Shift + Enter for a new line</span>
              <span aria-live="polite">
                {!historyReady
                  ? "Loading saved chat…"
                  : !usageReady
                    ? usageError
                      ? "Allowance unavailable"
                      : "Checking allowance…"
                    : `${remaining} messages left${restoreCountdown ? ` · restores in ${restoreCountdown}` : ""}`}
              </span>
            </div>
          </div>
        </section>

        <aside className="grid gap-4">
          {report ? (
            <section className="rounded-2xl border border-line bg-panel p-5">
              <div className="mb-4 flex items-center gap-2 text-teal">
                <HeartPulse size={17} aria-hidden="true" />
                <h2 className="m-0 text-[13px] font-semibold text-ink">
                  Your report at a glance
                </h2>
              </div>
              <p className="mb-4 text-[12px] leading-relaxed text-muted">
                {report.summary}
              </p>
              <dl className="grid gap-3 text-[11px]">
                <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                  <dt className="text-muted">Blood pressure</dt>
                  <dd className="m-0 text-right font-medium text-ink">
                    {report.inputs.systolic !== undefined &&
                    report.inputs.diastolic !== undefined
                      ? `${formatMeasurement(report.inputs.systolic)} / ${formatMeasurement(report.inputs.diastolic)}`
                      : "Not entered"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                  <dt className="text-muted">BMI</dt>
                  <dd className="m-0 text-right font-medium text-ink">
                    {report.bmi.category === "Not assessed"
                      ? "Not assessed"
                      : `${formatMeasurement(report.bmi.value)} · ${report.bmi.category}`}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                  <dt className="text-muted">Sleep</dt>
                  <dd className="m-0 text-right font-medium text-ink">
                    {formatMeasurement(report.inputs.sleepHours)} hr ·{" "}
                    {report.sleep.category}
                  </dd>
                </div>
              </dl>
            </section>
          ) : (
            <section className="rounded-2xl border border-line bg-panel p-5">
              <h2 className="mb-2 mt-0 font-display text-[22px] font-normal">
                A fresh conversation
              </h2>
              <p className="mb-0 text-[12px] leading-relaxed text-muted">
                This chat has no check-in attached. You can ask general wellness
                questions or start another chat with your latest report.
              </p>
            </section>
          )}
          <section className="rounded-2xl border border-line bg-teal-tint/60 p-5 text-[11px] leading-relaxed text-muted">
            <div className="mb-2 flex items-center gap-2 font-semibold text-teal">
              <ShieldCheck size={16} aria-hidden="true" /> A private, optional
              chat
            </div>
            <p className="mb-0">
              Your messages and any attached report snapshot are saved to your
              Firebase account and sent to Google Gemini when you send a
              message. Your private safety note is excluded. Do not include
              names or other identifying details.
            </p>
          </section>
          <p className="m-0 px-1 text-[10px] leading-relaxed text-soft">
            This AI guide is for general education, not medical advice. It
            cannot diagnose, prescribe, or replace a healthcare professional.
            Seek urgent care for emergency symptoms.
          </p>
        </aside>
      </div>
    </main>
  );
}

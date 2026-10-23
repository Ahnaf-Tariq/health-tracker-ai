"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  HeartPulse,
  Pause,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { WellnessReport } from "../domain/types";
import { formatMeasurement } from "../domain/format";
import { hasSelfHarmConcern } from "../domain/privacy";

type Message = { id: string; role: "user" | "assistant"; content: string };

interface Props {
  report: WellnessReport;
  onBack: () => void;
  onSupport: () => void;
}

const STARTER_PROMPTS = [
  "Can you explain my results in simple terms?",
  "What could I ask my doctor about feeling tired?",
  "What is one small habit I could try this week?",
];

function makeSessionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeContext(report: WellnessReport) {
  const { notes: _privateSafetyNote, ...answers } = report.inputs;
  return {
    answers,
    report: {
      ...report,
      inputs: answers,
      safety: { ...report.safety, selfHarmConcern: false },
    },
  };
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

export function ChatGuide({ report, onBack, onSupport }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I can help make sense of your check-in, think through small next steps, or prepare questions for your doctor. What would be most helpful?",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryText, setRetryText] = useState("");
  const [sessionId, setSessionId] = useState(makeSessionId);
  const [requestCount, setRequestCount] = useState(0);
  const conversationRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottomRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const context = useMemo(() => safeContext(report), [report]);
  const userMessageCount = messages.filter(
    (message) => message.role === "user",
  ).length;
  const remaining = Math.max(0, 20 - Math.max(userMessageCount, requestCount));

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
    composer.style.overflowY = composer.scrollHeight > maxHeight ? "auto" : "hidden";
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
    if (remaining <= 0) {
      setError(
        "This chat has reached its 20-message limit. Start over to begin a new chat.",
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
    setRequestCount((count) => count + 1);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          sessionId,
          context,
          messages: updatedHistory.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const message = await readError(response);
        if (message === "support_required") {
          onSupport();
          return;
        }
        throw new Error(message);
      }

      await consumeEventStream(response, (text) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + text }
              : message,
          ),
        );
      });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
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
      setRequestCount((count) => Math.max(0, count - 1));
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

  function startOver() {
    abortRef.current?.abort();
    sendingRef.current = false;
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "I can help make sense of your check-in, think through small next steps, or prepare questions for your doctor. What would be most helpful?",
      },
    ]);
    setSessionId(makeSessionId());
    setRequestCount(0);
    setDraft("");
    setError("");
    setNotice("");
    setRetryText("");
    setLoading(false);
  }

  function stopResponse() {
    if (!sendingRef.current) return;
    abortRef.current?.abort();
    setNotice("Response stopped. You can continue the conversation.");
  }

  return (
    <main
      className="mx-auto w-[calc(100%_-_32px)] max-w-[1160px] py-7 sm:w-[calc(100%_-_56px)] sm:py-10"
      aria-labelledby="chat-heading"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted transition hover:bg-teal-tint hover:text-teal focus-visible:outline-2 focus-visible:outline-teal"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Back to your report
        </button>
        <button
          type="button"
          onClick={startOver}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-xs font-medium text-muted transition hover:border-teal hover:text-teal disabled:opacity-50"
        >
          <RotateCcw size={15} aria-hidden="true" /> Start over
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
                    disabled={loading}
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
                disabled={loading || remaining === 0}
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
                  disabled={!draft.trim() || remaining === 0}
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
              <span>{remaining} messages left</span>
            </div>
          </div>
        </section>

        <aside className="grid gap-4">
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
          <section className="rounded-2xl border border-line bg-teal-tint/60 p-5 text-[11px] leading-relaxed text-muted">
            <div className="mb-2 flex items-center gap-2 font-semibold text-teal">
              <ShieldCheck size={16} aria-hidden="true" /> A private, optional
              chat
            </div>
            <p className="mb-0">
              Your chat and check-in context are sent to Google Gemini when you
              send a message. HealthTracker does not save conversations. Your
              private safety note is excluded. Don’t include names or other
              identifying details.
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

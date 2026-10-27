"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowRight, Eye, EyeOff, HeartPulse } from "lucide-react";
import { getFirebaseAuth } from "../lib/firebase";
import { getFirebaseDb } from "../lib/firebase";
import { Brand } from "./SiteHeader";

const slides = [
  {
    image: "/images/wellness-portrait.webp",
    title: "A clearer picture, at your pace.",
    body: "Your check-in stays simple and personal, with helpful context when you want it.",
  },
  {
    image: "/images/check-in-scene.webp",
    title: "Small steps can add up.",
    body: "Keep your conversations and wellness notes together in one private account.",
  },
  {
    image: "/images/care-detail.webp",
    title: "Feel ready for your next visit.",
    body: "Prepare thoughtful questions and make room for a better conversation with your clinician.",
  },
];

function getGoogleSignInError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;

  switch (code) {
    case "auth/unauthorized-domain":
      return "This website is not authorized for Google sign-in. In Firebase Console, open Authentication → Settings → Authorized domains and add the domain you are using (for local development, localhost).";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled for this Firebase project. Enable Google under Authentication → Sign-in method in Firebase Console.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site, then try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was canceled before it finished. Try again when you are ready.";
    case "auth/network-request-failed":
      return "Google sign-in could not reach Firebase. Check your connection, then try again.";
    case "auth/invalid-api-key":
      return "Firebase rejected the app's API key. Check that the Firebase web app settings in .env.local belong to this project.";
    default:
      return `Google sign-in failed${code ? ` (${code})` : ""}. Check the Firebase Authentication settings and try again.`;
  }
}

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const signup = mode === "signup";
  const [slide, setSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/check-in");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const candidate = params.get("next");
    if (candidate?.startsWith("/") && !candidate.startsWith("//"))
      setNext(candidate);
    const timer = window.setInterval(
      () => setSlide((value) => (value + 1) % slides.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (signup && password !== confirm) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      if (signup) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        if (name.trim())
          await updateProfile(credential.user, { displayName: name.trim() });
        await setDoc(
          doc(getFirebaseDb(), "users", credential.user.uid),
          {
            displayName: name.trim(),
            name: name.trim(),
            email: credential.user.email ?? email.trim(),
            chats_left: 10,
            restore_time: null,
            chat_limit_updated_at: null,
            address: "",
            avatarUrl: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        ).catch(() => {});
      } else await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace(next);
    } catch (caught) {
      const code = (caught as { code?: string }).code;
      setError(
        code === "auth/email-already-in-use"
          ? "An account already uses this email. Try signing in."
          : code === "auth/invalid-credential" ||
              code === "auth/wrong-password" ||
              code === "auth/user-not-found"
            ? "Email or password is incorrect."
            : code === "auth/weak-password"
              ? "Choose a password with at least 6 characters."
              : "We could not complete that request. Please check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setError("");
    setBusy(true);
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      router.replace(next);
    } catch (caught) {
      setError(getGoogleSignInError(caught));
    } finally {
      setBusy(false);
    }
  }

  const current = slides[slide] ?? slides[0]!;
  return (
    <main className="h-dvh w-full overflow-hidden bg-panel">
      <div className="grid h-dvh w-full bg-panel lg:grid-cols-[0.92fr_1.08fr]">
        <section
          className="flex min-h-0 items-center justify-center px-6 py-2 sm:px-10 sm:py-3 lg:px-14 xl:px-20"
          aria-labelledby="auth-title"
        >
          <div className="w-full max-w-[420px]">
            <div className="mb-3">
              <Brand />
            </div>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[.16em] text-teal">
              YOUR WELLNESS, TOGETHER
            </span>
            <h1
              id="auth-title"
              className="m-0 font-display text-[34px] font-normal leading-tight tracking-[-.035em]"
            >
              {signup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mb-2 mt-1 text-[12px] leading-relaxed text-muted">
              {signup
                ? "Save your conversations and pick up where you left off."
                : "Sign in to continue to your HealthTracker action."}
            </p>
            <form onSubmit={submit} className="grid gap-2 lg:grid-cols-2">
              {signup && (
                <label className="grid gap-1 text-[11px] font-medium lg:col-span-2">
                  Full name
                  <input
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 rounded-xl border border-line bg-panel px-3 text-[12px] outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                    placeholder="Your name"
                  />
                </label>
              )}
              <label className="grid gap-1 text-[11px] font-medium lg:col-span-2">
                Email address
                <input
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl border border-line bg-panel px-3 text-[12px] outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                  placeholder="you@example.com"
                />
              </label>
              <label
                className={`grid gap-1 text-[11px] font-medium ${signup ? "" : "lg:col-span-2"}`}
              >
                Password
                <span className="relative block">
                  <input
                    autoComplete={signup ? "new-password" : "current-password"}
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 w-full rounded-xl border border-line bg-panel px-3 pr-10 text-[12px] outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-paper"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
              {signup && (
                <label className="grid gap-1 text-[11px] font-medium">
                  Confirm password
                  <span className="relative block">
                    <input
                      autoComplete="new-password"
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="h-10 w-full rounded-xl border border-line bg-panel px-3 pr-10 text-[12px] outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-paper"
                      aria-label={
                        showConfirm
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </label>
              )}
              {error && (
                <p
                  role="alert"
                  className="m-0 rounded-lg bg-red-bg px-3 py-2 text-[11px] leading-snug text-red lg:col-span-2"
                >
                  {error}
                </p>
              )}
              <button
                disabled={busy}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal px-5 text-[12px] font-semibold text-white transition hover:bg-teal-strong disabled:opacity-60 lg:col-span-2"
              >
                {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
                <ArrowRight size={15} />
              </button>
            </form>
            <div className="my-1 flex items-center gap-3 text-xs text-soft">
              <span className="h-px flex-1 bg-line" />
              or continue with
              <span className="h-px flex-1 bg-line" />
            </div>
            <button
              type="button"
              onClick={googleSignIn}
              disabled={busy}
              className="flex min-h-10 w-full items-center justify-center gap-3 rounded-xl border border-line bg-panel text-[12px] font-semibold text-ink transition hover:bg-paper disabled:opacity-60"
            >
              <span className="grid size-5 place-items-center rounded-full border border-line font-bold text-[11px]">
                G
              </span>
              Continue with Google
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">
              {signup ? "Already have an account? " : "New to HealthTracker? "}
              <Link
                className="font-semibold text-teal underline-offset-4 hover:underline"
                href={`${signup ? "/login" : "/signup"}?next=${encodeURIComponent(next)}`}
              >
                {signup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </div>
        </section>
        <aside
          className="relative hidden h-dvh overflow-hidden bg-[#0b3d37] lg:block"
          aria-label="HealthTracker welcome"
        >
          {slides.map((item, index) => (
            <img
              key={item.image}
              src={item.image}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${index === slide ? "opacity-60" : "opacity-0"}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#082b29]/95 via-[#082b29]/20 to-[#082b29]/10" />
          <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14 text-white">
            <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <HeartPulse size={22} />
            </span>
            <h2 className="max-w-[460px] font-display text-[42px] font-normal leading-[1.08] tracking-[-.03em]">
              {current.title}
            </h2>
            <p className="mb-8 max-w-[390px] text-[13px] leading-relaxed text-white/80">
              {current.body}
            </p>
            <div className="flex gap-2">
              {slides.map((item, index) => (
                <button
                  key={item.image}
                  aria-label={`Show slide ${index + 1}`}
                  onClick={() => setSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${index === slide ? "w-8 bg-white" : "w-3 bg-white/40"}`}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

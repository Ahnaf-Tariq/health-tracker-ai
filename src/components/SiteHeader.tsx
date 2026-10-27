"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Dropdown, type MenuProps } from "antd";
import { signOut } from "firebase/auth";
import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { useAppTheme, useAuth } from "./AppProviders";
import { getFirebaseAuth } from "../lib/firebase";
import { useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center gap-2.5 text-ink no-underline"
      aria-label="HealthTracker home"
    >
      <span
        className={`${footer ? "size-7" : "size-8"} flex items-center justify-center rounded-full bg-teal-tint text-teal`}
      >
        <Activity className="size-6" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span
        className={`${footer ? "text-[13px]" : "text-[15px] sm:text-[17px]"} font-bold tracking-[-0.04em]`}
      >
        HealthTracker
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { dark, toggleTheme } = useAppTheme();
  const { user, authReady } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const accountItems: MenuProps["items"] = [
    { key: "profile", label: "Profile", icon: <UserRound size={16} /> },
    { key: "chat", label: "Chat history", icon: <MessageCircle size={16} /> },
    { key: "check-in", label: "Check-in", icon: <ClipboardCheck size={16} /> },
    { type: "divider" },
    {
      key: "sign-out",
      label: "Sign out",
      icon: <LogOut size={16} />,
      danger: true,
    },
  ];

  async function confirmLogout() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      await signOut(getFirebaseAuth());
      setConfirmSignOut(false);
      router.replace("/login");
    } catch {
      setSignOutError(
        "You could not be signed out. Check your connection and try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line/60 bg-panel/95 shadow-[0_2px_12px_rgba(16,45,46,0.03)] backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-[66px] max-w-[1240px] items-center justify-between gap-4 px-6 sm:px-10 lg:px-12">
          <Brand />
          <nav
            className="hidden items-center gap-8 text-[13px] font-medium md:flex"
            aria-label="Main navigation"
          >
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              className="text-ink transition-colors hover:text-teal"
            >
              Home
            </Link>
            <a
              href="/#how-it-works"
              className="text-ink transition-colors hover:text-teal"
            >
              How It Works
            </a>
            <a
              href="/#insights"
              className="text-ink transition-colors hover:text-teal"
            >
              Insights
            </a>
            <Link
              href="/about"
              aria-current={pathname === "/about" ? "page" : undefined}
              className="text-ink transition-colors hover:text-teal"
            >
              About
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="cursor-pointer inline-flex size-9 items-center justify-center rounded-full bg-teal-tint/70 text-ink transition-colors hover:bg-teal-tint"
              aria-label={dark ? "Use light theme" : "Use dark theme"}
              title={dark ? "Use light theme" : "Use dark theme"}
            >
              {dark ? (
                <Sun size={17} strokeWidth={1.6} />
              ) : (
                <Moon size={17} strokeWidth={1.6} />
              )}
            </button>

            <>
              <details className="relative md:hidden">
                <summary
                  aria-label="Open navigation"
                  className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full bg-teal-tint text-teal [&::-webkit-details-marker]:hidden"
                >
                  <Menu size={19} />
                </summary>
                <nav
                  aria-label="Mobile navigation"
                  className="absolute right-0 top-12 flex w-52 flex-col rounded-xl border border-line bg-panel p-2 text-[13px] shadow-panel [&_a]:rounded-lg [&_a]:px-4 [&_a]:py-3 [&_a:hover]:bg-teal-tint"
                >
                  <Link href="/">Home</Link>
                  <a href="/#how-it-works">How It Works</a>
                  <a href="/#insights">Insights</a>
                  <Link
                    href="/about"
                    aria-current={pathname === "/about" ? "page" : undefined}
                  >
                    About us
                  </Link>
                  {!user && authReady ? (
                    <Link href="/check-in" className="font-semibold text-teal">
                      Start your check-in
                    </Link>
                  ) : null}
                </nav>
              </details>
              {user ? (
                <Dropdown
                  trigger={["click"]}
                  placement="bottomRight"
                  menu={{
                    items: accountItems,
                    onClick: ({ key }) => {
                      if (key === "sign-out") {
                        setSignOutError("");
                        setConfirmSignOut(true);
                      } else if (key === "profile") {
                        router.push("/profile");
                      } else if (key === "chat") {
                        router.push("/chat");
                      } else if (key === "check-in") {
                        router.push("/check-in");
                      }
                    },
                  }}
                  popupRender={(menu) => (
                    <div className="min-w-[200px] overflow-hidden rounded-xl border border-line bg-panel shadow-panel">
                      <div className="border-b border-line px-4 py-3">
                        <p className="mb-0 truncate text-[13px] font-semibold text-ink">
                          {user.displayName || "Your account"}
                        </p>
                        {user.email ? (
                          <p className="mb-0 mt-1 truncate text-[11px] text-muted">
                            {user.email}
                          </p>
                        ) : null}
                      </div>
                      {menu}
                    </div>
                  )}
                >
                  <button
                    type="button"
                    className="inline-flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-teal-tint bg-teal-tint p-0"
                    aria-label="Open account menu"
                    title="Account menu"
                  >
                    <img
                      src={user.photoURL || "/avatar-placeholder.png"}
                      alt=""
                      className="size-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/avatar-placeholder.png";
                      }}
                    />
                  </button>
                </Dropdown>
              ) : authReady ? (
                <Link
                  href="/check-in"
                  className="hidden min-h-10 items-center gap-2 rounded-full bg-ink px-3.5 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-teal sm:gap-3 sm:px-5 md:inline-flex dark:bg-teal-strong"
                  aria-label="Get Started"
                >
                  <span className="hidden sm:inline">Get Started For Free</span>
                  <span className="sm:hidden">Start</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <span
                  aria-hidden="true"
                  className="size-10 animate-pulse rounded-full bg-teal-tint"
                />
              )}
            </>
          </div>
        </div>
      </header>
      <div className="h-[78px] shrink-0 print:hidden" aria-hidden="true" />
      <ConfirmationModal
        open={confirmSignOut}
        title="Sign out?"
        message="You’ll be signed out on this device. Your profile and saved chats will remain in your account."
        confirmLabel="Sign out"
        busyLabel="Signing out…"
        icon={<LogOut size={18} aria-hidden="true" />}
        confirmVariant="danger"
        busy={signingOut}
        errorMessage={signOutError}
        onClose={() => setConfirmSignOut(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}

"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  Camera,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "./AppProviders";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ConfirmationModal } from "./ConfirmationModal";
import { getFirebaseAuth, getFirebaseDb } from "../lib/firebase";

const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
const AVATAR_FILE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  public_id: string;
  overwrite: boolean;
  signature: string;
  error?: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: { message?: string };
};

type AvatarUploadStage = "preparing" | "uploading" | "saving";

function uploadCloudinaryImage(
  url: string,
  data: FormData,
  onProgress: (progress: number) => void,
) {
  return new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.responseType = "json";
    request.timeout = 120_000;
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    });
    request.addEventListener("load", () => {
      const result = (request.response ?? {}) as CloudinaryUploadResponse;
      if (request.status >= 200 && request.status < 300 && result.secure_url) {
        resolve(result);
        return;
      }
      reject(new Error(result.error?.message || "Cloudinary could not upload this photo."));
    });
    request.addEventListener("error", () =>
      reject(new Error("The upload connection failed. Please try again.")),
    );
    request.addEventListener("timeout", () =>
      reject(new Error("The upload took too long. Check your connection and try again.")),
    );
    request.addEventListener("abort", () =>
      reject(new Error("The photo upload was interrupted. Please try again.")),
    );
    request.send(data);
  });
}

export function ProfilePage() {
  const { user, authReady } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadStage, setAvatarUploadStage] =
    useState<AvatarUploadStage | null>(null);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (authReady && !user)
      router.replace(`/login?next=${encodeURIComponent("/profile")}`);
    if (user) {
      setName(user.displayName ?? "");
      setAvatarUrl(user.photoURL ?? "");
      void getDoc(doc(getFirebaseDb(), "users", user.uid))
        .then((snap) => {
          const data = snap.data();
          if (data) {
            setName(data.displayName ?? user.displayName ?? "");
            setAddress(data.address ?? "");
            setAvatarUrl(data.avatarUrl || user.photoURL || "");
          }
        })
        .catch(() =>
          setError(
            "Profile could not be loaded. Please refresh and try again.",
          ),
        );
    }
  }, [authReady, user, router]);

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !user) return;
    if (!AVATAR_FILE_TYPES.has(file.type) || file.size > AVATAR_MAX_SIZE) {
      setError("Choose a JPEG, PNG, or WebP image up to 5 MB.");
      return;
    }
    setUploadingAvatar(true);
    setAvatarUploadStage("preparing");
    setAvatarUploadProgress(0);
    setError("");
    setNotice("");
    try {
      const token = await user.getIdToken();
      const signatureResponse = await fetch("/api/profile/avatar/signature", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const signature = (await signatureResponse
        .json()
        .catch(() => ({}))) as CloudinarySignature;
      if (!signatureResponse.ok) {
        throw new Error(
          signature.error || "The profile photo upload could not be authorized.",
        );
      }

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", signature.apiKey);
      uploadData.append("timestamp", String(signature.timestamp));
      uploadData.append("folder", signature.folder);
      uploadData.append("public_id", signature.public_id);
      uploadData.append("overwrite", String(signature.overwrite));
      uploadData.append("signature", signature.signature);

      setAvatarUploadStage("uploading");
      const uploaded = await uploadCloudinaryImage(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
        uploadData,
        setAvatarUploadProgress,
      );
      const secureUrl = uploaded.secure_url;
      if (!secureUrl) {
        throw new Error(
          uploaded.error?.message || "Cloudinary could not upload this photo.",
        );
      }

      setAvatarUploadStage("saving");
      await setDoc(
        doc(getFirebaseDb(), "users", user.uid),
        { avatarUrl: secureUrl, updatedAt: serverTimestamp() },
        { merge: true },
      );
      await updateProfile(user, { photoURL: secureUrl });
      setAvatarUrl(secureUrl);
      setNotice("Your profile photo has been uploaded and saved.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The photo could not be uploaded. Please try again.",
      );
    } finally {
      setUploadingAvatar(false);
      setAvatarUploadStage(null);
      setAvatarUploadProgress(0);
    }
  }

  async function saveProfile() {
    if (!user || savingProfile || uploadingAvatar) return;
    setSavingProfile(true);
    setError("");
    setNotice("");
    try {
      await setDoc(
        doc(getFirebaseDb(), "users", user.uid),
        {
          displayName: name.trim(),
          name: name.trim(),
          address: address.trim(),
          avatarUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await updateProfile(user, {
        displayName: name.trim(),
        photoURL: avatarUrl || null,
      });
      setNotice("Your profile has been saved.");
    } catch {
      setError(
        "Your profile could not be saved. Please check your connection and try again.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut(getFirebaseAuth());
      setConfirmSignOut(false);
      router.replace("/login");
    } catch {
      setError(
        "You could not be signed out. Please check your connection and try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }
  if (!authReady || !user)
    return (
      <>
        <SiteHeader />
        <main className="min-h-[60vh]" />
      </>
    );
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-[calc(100%_-_32px)] max-w-[1040px] flex-1 py-10 sm:w-[calc(100%_-_64px)] sm:py-14">
        <div className="mb-8">
          <span className="text-[10px] font-bold tracking-[.15em] text-teal">
            YOUR ACCOUNT
          </span>
          <h1 className="mb-1 mt-1 font-display text-[42px] font-normal tracking-[-.04em]">
            Profile & preferences
          </h1>
          <p className="m-0 text-[13px] text-muted">
            Update the details connected to your HealthTracker account.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-2xl border border-line bg-panel p-6 shadow-panel sm:p-8">
            <div className="mb-7 flex flex-wrap items-center gap-5">
              <div className="relative grid size-24 place-items-center overflow-hidden rounded-full bg-teal-tint text-teal">
                <img
                  src={avatarUrl || "/avatar-placeholder.png"}
                  alt="Profile"
                  className="size-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/avatar-placeholder.png";
                  }}
                />
                <label
                  className={`absolute inset-x-0 bottom-0 flex h-8 items-center justify-center bg-ink/65 text-white ${uploadingAvatar || savingProfile ? "cursor-wait opacity-80" : "cursor-pointer"}`}
                  title={uploadingAvatar ? "Uploading photo…" : "Upload a profile photo"}
                >
                  {uploadingAvatar ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Camera size={15} />
                  )}
                  <span className="sr-only">
                    {uploadingAvatar ? "Uploading profile photo" : "Upload profile photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    aria-label="Choose a profile photo"
                    disabled={uploadingAvatar || savingProfile}
                    onChange={uploadAvatar}
                  />
                </label>
                {uploadingAvatar && (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-full bg-ink/70 text-white"
                    role="progressbar"
                    aria-label="Profile photo upload progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={
                      avatarUploadStage === "preparing"
                        ? undefined
                        : avatarUploadStage === "saving"
                          ? 100
                          : avatarUploadProgress
                    }
                    aria-valuetext={
                      avatarUploadStage === "preparing"
                        ? "Preparing upload"
                        : avatarUploadStage === "saving"
                          ? "Saving photo"
                          : `${avatarUploadProgress}% uploaded`
                    }
                  >
                    <LoaderCircle size={21} className="animate-spin" />
                    <span className="text-[10px] font-semibold">
                      {avatarUploadStage === "uploading"
                        ? `${avatarUploadProgress}%`
                        : avatarUploadStage === "saving"
                          ? "Saving"
                          : "Preparing"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="m-0 font-display text-[26px] font-normal">
                  {name || "Your profile"}
                </h2>
                <p className="mb-0 mt-1 text-[12px] text-muted">{user.email}</p>
              </div>
            </div>
            <div className="grid gap-5">
              <label className="grid gap-1.5 text-[12px] font-medium">
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="h-12 rounded-xl border border-line bg-paper px-4 text-[13px] outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"
                />
              </label>
              <label className="grid gap-1.5 text-[12px] font-medium">
                Email address
                <input
                  value={user.email ?? ""}
                  disabled
                  className="h-12 rounded-xl border border-line bg-paper/60 px-4 text-[13px] text-muted"
                />
                <span className="text-[10px] font-normal text-soft">
                  Email is managed by your sign-in provider.
                </span>
              </label>
              <label className="grid gap-1.5 text-[12px] font-medium">
                Address (Optional)
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={300}
                  className="resize-none rounded-xl border border-line bg-paper px-4 py-3 text-[13px] outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"
                  placeholder="Add an address if you want it on your profile"
                />
              </label>
            </div>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-bg px-3 py-2 text-[12px] text-red"
              >
                {error}
              </p>
            )}
            {notice && (
              <p
                role="status"
                className="mt-4 rounded-lg bg-teal-tint px-3 py-2 text-[12px] text-teal"
              >
                {notice}
              </p>
            )}
            <button
              onClick={saveProfile}
              disabled={savingProfile || uploadingAvatar}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal px-5 text-[12px] font-semibold text-white hover:bg-teal-strong disabled:opacity-60"
            >
              <Save size={16} />
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </section>
          <aside className="grid content-start gap-2">
            <section className="rounded-2xl border border-line bg-panel p-5">
              <div className="mb-3 flex items-center gap-2 text-teal">
                <ShieldCheck size={17} />
                <h2 className="m-0 text-[13px] font-semibold text-ink">
                  Your account data
                </h2>
              </div>
              <p className="mb-0 text-[11px] leading-relaxed text-muted">
                Your profile and chat history are stored in your Firebase
                account. A check-in report is saved only with a report-based
                chat. Your private safety note is excluded from chat context.
              </p>
            </section>
            <button
              onClick={() => router.push("/chat")}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-panel px-4 text-left text-[12px] font-medium hover:border-teal"
            >
              <MessageCircle size={17} className="text-teal" />
              Open chat history
            </button>
            <button
              onClick={() => setConfirmSignOut(true)}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-panel px-4 text-left text-[12px] font-medium text-muted hover:border-red hover:text-red"
            >
              <LogOut size={17} />
              Sign out
            </button>
          </aside>
        </div>
      </main>
      <SiteFooter compact />
      <ConfirmationModal
        open={confirmSignOut}
        title="Sign out?"
        message="You’ll be signed out on this device. Your saved profile and conversations will remain in your account."
        confirmLabel="Sign out"
        busyLabel="Signing out…"
        icon={<LogOut size={18} aria-hidden="true" />}
        confirmVariant="danger"
        busy={signingOut}
        onClose={() => setConfirmSignOut(false)}
        onConfirm={logout}
      />
    </div>
  );
}

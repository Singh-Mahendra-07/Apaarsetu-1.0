"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Trash2,
  Upload,
  UserCog,
} from "lucide-react";

/* -------------------------------- Types -------------------------------- */

type Profile = {
  name: string;
  email: string;
  role: string;
  photoUrl: string | null;
};

type Notice = { ok: boolean; text: string } | null;

const getInitialProfile = (): Profile => {
  if (typeof window !== "undefined") {
    try {
      const u = localStorage.getItem("apaarsetu_user_profile") || localStorage.getItem("apaarsetu_user");
      if (u) {
        const parsed = JSON.parse(u);
        return {
          name: parsed.fullName || parsed.name || "",
          email: parsed.email || "",
          role: parsed.role || "ROLE_AICTE_ADMIN",
          photoUrl: parsed.photoUrl || null,
        };
      }
    } catch {}
  }
  return {
    name: "",
    email: "",
    role: "ROLE_AICTE_ADMIN",
    photoUrl: null,
  };
};

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

/* -------------------------------- Helpers -------------------------------- */

function getAuthHeaders(isJson = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("apaarsetu_access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

// Reads the API's error message when it sends one, otherwise falls back to the status code.
async function readError(res: Response) {
  if (res.status === 401) {
    return "Session expired or authentication missing. Please sign in again.";
  }
  try {
    const j = await res.json();
    return (j.message as string) || (j.error as string) || `Request failed (${res.status}).`;
  } catch {
    return `Request failed (${res.status}).`;
  }
}

const passwordChecks = (pw: string) => [
  { label: "At least 8 characters", ok: pw.length >= 8 },
  { label: "An uppercase and a lowercase letter", ok: /[A-Z]/.test(pw) && /[a-z]/.test(pw) },
  { label: "A number", ok: /\d/.test(pw) },
  { label: "A special character", ok: /[^A-Za-z0-9]/.test(pw) },
];

/* --------------------------------- Page --------------------------------- */

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile>(getInitialProfile);
  const [apiUp, setApiUp] = useState(true);

  useEffect(() => {
    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => setApiUp(r.ok))
      .catch(() => setApiUp(false));

    (async () => {
      try {
        const res = await fetch("/api/v1/profile", {
          headers: getAuthHeaders(),
          cache: "no-store",
        });
        if (res.ok) {
          setProfile((await res.json()) as Profile);
          setApiUp(true);
        } else if (res.status === 401 || res.status === 403) {
          setApiUp(true);
        }
      } catch {
        // Network connection error
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ------------------------------ Top bar ------------------------------ */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            System Administration
          </p>
          <h2 className="text-xl font-bold">Central Control Center</h2>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
              apiUp
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${apiUp ? "bg-emerald-500" : "bg-red-500"}`} />
            {apiUp ? "National Gateway Operational" : "National Gateway Offline"}
          </span>
          <button
            aria-label="Notifications"
            className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          <Avatar profile={profile} size="h-8 w-8 text-sm" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-8 py-6">
        <Link
          href="/aicte-admin"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Central Dashboard
        </Link>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <UserCog className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="mt-3 text-slate-600">
            Change your profile photo, sign-in email and password.
          </p>

          <div className="mt-8 space-y-6">
            <PhotoCard profile={profile} onChange={(photoUrl) => setProfile({ ...profile, photoUrl })} />
            <EmailCard profile={profile} onChange={(email) => setProfile({ ...profile, email })} />
            <PasswordCard />
          </div>
        </section>
      </main>
    </div>
  );
}

/* ------------------------------- Photo card ------------------------------- */

function PhotoCard({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!PHOTO_TYPES.includes(f.type)) {
      setNotice({ ok: false, text: "Choose a JPG, PNG or WebP image." });
      return;
    }
    if (f.size > MAX_PHOTO_BYTES) {
      setNotice({ ok: false, text: "Choose an image smaller than 2 MB." });
      return;
    }
    setNotice(null);
    setFile(f);
  };

  const save = async () => {
    if (!file) return;
    setBusy(true);
    setNotice(null);
    try {
      const body = new FormData();
      body.append("photo", file);
      const res = await fetch("/api/v1/profile/photo", {
        method: "POST",
        headers: getAuthHeaders(),
        body,
      });
      if (!res.ok) throw new Error(await readError(res));
      const { photoUrl } = (await res.json()) as { photoUrl: string };
      onChange(photoUrl);
      setFile(null);
      setNotice({ ok: true, text: "Profile photo updated." });
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : "Could not upload the photo." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/v1/profile/photo", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(await readError(res));
      onChange(null);
      setFile(null);
      setNotice({ ok: true, text: "Profile photo removed." });
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : "Could not remove the photo." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Profile Photo" description="JPG, PNG or WebP, up to 2 MB.">
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative">
          <Avatar profile={{ ...profile, photoUrl: preview ?? profile.photoUrl }} size="h-24 w-24 text-3xl" />
          <button
            type="button"
            aria-label="Choose a new photo"
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow hover:bg-slate-50"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input ref={inputRef} type="file" accept={PHOTO_TYPES.join(",")} onChange={pick} className="hidden" />
        </div>

        <div className="flex flex-wrap gap-3">
          {file ? (
            <>
              <button
                onClick={save}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save photo
              </button>
              <button
                onClick={() => setFile(null)}
                disabled={busy}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <Upload className="h-4 w-4" /> Upload new photo
              </button>
              {profile.photoUrl && (
                <button
                  onClick={remove}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" /> Remove photo
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <NoticeLine notice={notice} />
    </Card>
  );
}

/* ------------------------------- Email card ------------------------------- */

function EmailCard({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      setNotice({ ok: false, text: "Enter a valid email address." });
      return;
    }
    if (next.toLowerCase() === profile.email.toLowerCase()) {
      setNotice({ ok: false, text: "That is already your email address." });
      return;
    }
    if (!password) {
      setNotice({ ok: false, text: "Enter your current password to confirm this change." });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/v1/profile/email", {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ newEmail: next, currentPassword: password }),
      });
      if (!res.ok) throw new Error(await readError(res));
      onChange(next);
      setEmail("");
      setPassword("");
      setNotice({ ok: true, text: "Email updated. Use the new address the next time you sign in." });
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : "Could not update the email." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Email Address" description="This is the address you sign in with.">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
          <Mail className="h-4 w-4 text-slate-500" />
          <span className="text-slate-600">Current email:</span>
          <span className="font-medium">
            {profile.email || <span className="inline-block h-4 w-32 animate-pulse rounded bg-slate-200" />}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="name@aicte.gov.in"
              className={inputCls}
            />
          </Field>
          <Field label="Current password">
            <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
          </Field>
        </div>

        <SubmitRow busy={busy} label="Update email" notice={notice} />
      </form>
    </Card>
  );
}

/* ------------------------------ Password card ------------------------------ */

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const checks = useMemo(() => passwordChecks(next), [next]);
  const passed = checks.filter((c) => c.ok).length;
  const strength = passed <= 1 ? { label: "Weak", cls: "bg-red-500" } : passed <= 3 ? { label: "Fair", cls: "bg-amber-500" } : { label: "Strong", cls: "bg-emerald-500" };
  const mismatch = confirm.length > 0 && confirm !== next;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return setNotice({ ok: false, text: "Enter your current password." });
    if (passed < checks.length) return setNotice({ ok: false, text: "The new password doesn't meet all the requirements yet." });
    if (next === current) return setNotice({ ok: false, text: "Choose a password different from your current one." });
    if (next !== confirm) return setNotice({ ok: false, text: "The new passwords don't match." });

    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/v1/profile/password", {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) throw new Error(await readError(res));
      setCurrent("");
      setNext("");
      setConfirm("");
      setNotice({ ok: true, text: "Password updated." });
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : "Could not update the password." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Password" description="Use a password you don't use anywhere else.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Current password">
          <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password">
            <PasswordInput value={next} onChange={setNext} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" invalid={mismatch} />
            {mismatch && <p className="mt-1 text-xs text-red-600">Passwords don't match.</p>}
          </Field>
        </div>

        {next && (
          <div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                <div
                  className={`h-1.5 rounded-full transition-all ${strength.cls}`}
                  style={{ width: `${(passed / checks.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600">{strength.label}</span>
            </div>
            <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
              {checks.map((c) => (
                <li key={c.label} className={`flex items-center gap-1.5 ${c.ok ? "text-emerald-700" : "text-slate-500"}`}>
                  <Check className={`h-3.5 w-3.5 ${c.ok ? "" : "opacity-30"}`} /> {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <SubmitRow busy={busy} label="Update password" icon={<KeyRound className="h-4 w-4" />} notice={notice} />
      </form>
    </Card>
  );
}

/* ------------------------------ Small pieces ------------------------------ */

function Avatar({ profile, size }: { profile: Profile; size: string }) {
  if (profile.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={profile.photoUrl} alt={`${profile.name || "User"}'s photo`} className={`${size} rounded-full object-cover`} />
    );
  }
  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "";
  if (!initial) {
    return <div className={`${size} animate-pulse rounded-full bg-slate-200`} />;
  }
  return (
    <div
      aria-label={profile.name}
      className={`${size} flex items-center justify-center rounded-full bg-indigo-700 font-semibold text-white`}
    >
      {initial}
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
      <p className="mb-5 mt-1 text-sm text-slate-600">{description}</p>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function PasswordInput({
  value,
  onChange,
  autoComplete,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        className={`${inputCls} pr-10 ${invalid ? "border-red-400" : ""}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SubmitRow({
  busy,
  label,
  icon,
  notice,
}: {
  busy: boolean;
  label: string;
  icon?: React.ReactNode;
  notice: Notice;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {busy ? "Saving..." : label}
      </button>
      <NoticeLine notice={notice} />
    </div>
  );
}

function NoticeLine({ notice }: { notice: Notice }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-sm ${notice ? (notice.ok ? "mt-3 text-emerald-700" : "mt-3 text-red-600") : ""}`}
    >
      {notice?.text}
    </p>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Building2,
  Camera,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  UserCog,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import OfficerProfileDropdown from "@/components/layout/OfficerProfileDropdown";

/* -------------------------------- Types -------------------------------- */

type Notice = { ok: boolean; text: string } | null;

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

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

async function readError(res: Response) {
  if (res.status === 401) {
    return "Session expired or authentication missing. Please sign in again.";
  }
  try {
    const j = await res.json();
    return (
      (j.message as string) ||
      (j.error as string) ||
      `Request failed (${res.status}).`
    );
  } catch {
    return `Request failed (${res.status}).`;
  }
}

const passwordChecks = (pw: string) => [
  { label: "At least 8 characters", ok: pw.length >= 8 },
  {
    label: "An uppercase and a lowercase letter",
    ok: /[A-Z]/.test(pw) && /[a-z]/.test(pw),
  },
  { label: "A number", ok: /\d/.test(pw) },
  { label: "A special character", ok: /[^A-Za-z0-9]/.test(pw) },
];

/* --------------------------------- Page --------------------------------- */

export default function OfficerSystemSettingPage() {
  const { user, refreshProfile, logout } = useAuth();
  const router = useRouter();
  const [apiUp, setApiUp] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => setApiUp(r.ok))
      .catch(() => setApiUp(false));
  }, []);

  const employeeId =
    mounted && user?.id
      ? `AICTE-RO-${user.id.slice(-6).toUpperCase()}`
      : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-4 shadow-xs">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Regulatory Compliance Division
          </p>
          <h2 className="text-xl font-bold tracking-tight">
            Officer Profile & Console Security
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
              apiUp
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                apiUp ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            {apiUp
              ? "API Connected (Port 8081)"
              : "API Unreachable (Port 8081)"}
          </span>

          <OfficerProfileDropdown />
        </div>
      </header>

      {/* ------------------------------- Main ------------------------------- */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/aicte-officer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Officer Console
          </Link>
        </div>

        <div className="space-y-8">
          {/* Officer Identity & Clearance Overview Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <UserCog className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Officer Account Profile
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Manage your identity, assigned zone jurisdiction, and portal
                    security credentials.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {mounted && user?.status ? user.status : "ACTIVE"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {mounted && user?.role
                    ? user.role.replace("ROLE_", "")
                    : "AICTE_OFFICER"}
                </span>
              </div>
            </div>

            {/* Officer Metadata Grid */}
            <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Officer Name
                </p>
                <p className="mt-1 font-bold text-slate-900 truncate">
                  {mounted && user?.fullName ? (
                    user.fullName
                  ) : (
                    <span className="inline-block h-4 w-28 animate-pulse rounded bg-slate-200" />
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Official Email
                </p>
                <p className="mt-1 font-semibold text-slate-900 truncate text-xs sm:text-sm">
                  {mounted && user?.email ? (
                    user.email
                  ) : (
                    <span className="inline-block h-3.5 w-36 animate-pulse rounded bg-slate-200" />
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Employee ID
                </p>
                <p className="mt-1 font-mono font-bold text-indigo-700">
                  {employeeId || (
                    <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-slate-200" />
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Assigned Jurisdiction
                </p>
                <p className="mt-1 font-bold text-emerald-700">
                  {mounted && user?.region ? (
                    `${user.region} ZONE`
                  ) : (
                    <span className="inline-block h-3.5 w-20 animate-pulse rounded bg-slate-200" />
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Photo Management Card */}
          <PhotoCard />

          {/* Email Update Card */}
          <EmailCard />

          {/* Password Security Card */}
          <PasswordCard />

          {/* Officer Regulatory Alert Preferences Card */}
          <PreferencesCard />
        </div>
      </main>
    </div>
  );
}

/* ------------------------------- Photo Card ------------------------------- */

function PhotoCard() {
  const { user, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!PHOTO_TYPES.includes(f.type)) {
      setNotice({ ok: false, text: "Choose a JPG, PNG, or WebP image." });
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
      setFile(null);
      await refreshProfile();
      setNotice({ ok: true, text: "Official profile photo updated successfully." });
    } catch (err) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : "Could not upload the photo.",
      });
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
      setFile(null);
      await refreshProfile();
      setNotice({ ok: true, text: "Profile photo removed." });
    } catch (err) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : "Could not remove the photo.",
      });
    } finally {
      setBusy(false);
    }
  };

  const displayPhoto = preview || user?.photoUrl;

  return (
    <Card
      title="Officer Profile Photo"
      description="Upload an official passport-size photo (JPG, PNG, or WebP, up to 2 MB)."
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative">
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt="Officer profile"
              className="h-24 w-24 rounded-2xl object-cover ring-4 ring-indigo-100 shadow-md"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-900 font-bold text-3xl text-white shadow-md ring-4 ring-indigo-100">
              {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : "RO"}
            </div>
          )}

          <button
            type="button"
            aria-label="Upload photo"
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 hover:text-indigo-600"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={PHOTO_TYPES.join(",")}
            onChange={pick}
            className="hidden"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {file ? (
            <>
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Photo
              </button>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={busy}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-600 bg-indigo-50/50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Upload className="h-4 w-4" /> Upload New Photo
              </button>
              {user?.photoUrl && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" /> Remove Photo
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

/* ------------------------------- Email Card ------------------------------- */

function EmailCard() {
  const { user, refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      setNotice({ ok: false, text: "Enter a valid official email address." });
      return;
    }
    if (next.toLowerCase() === user?.email?.toLowerCase()) {
      setNotice({ ok: false, text: "That is already your current email address." });
      return;
    }
    if (!password) {
      setNotice({
        ok: false,
        text: "Enter your current password to authorize this change.",
      });
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
      setEmail("");
      setPassword("");
      await refreshProfile();
      setNotice({
        ok: true,
        text: "Official email updated successfully. Use the new address on your next login.",
      });
    } catch (err) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : "Could not update email.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="Official Email Address"
      description="The primary email address registered for portal login and regulatory notifications."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm">
          <Mail className="h-4 w-4 text-slate-500" />
          <span className="text-slate-600">Current email:</span>
          <span className="font-semibold text-slate-900">{user?.email}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New Official Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="officer@aicte.gov.in"
              className={inputCls}
            />
          </Field>
          <Field label="Current Password (Verification)">
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          </Field>
        </div>

        <SubmitRow busy={busy} label="Update Email" notice={notice} />
      </form>
    </Card>
  );
}

/* ----------------------------- Password Card ----------------------------- */

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const checks = useMemo(() => passwordChecks(next), [next]);
  const passed = checks.filter((c) => c.ok).length;
  const strength =
    passed <= 1
      ? { label: "Weak", cls: "bg-red-500" }
      : passed <= 3
      ? { label: "Fair", cls: "bg-amber-500" }
      : { label: "Strong", cls: "bg-emerald-500" };
  const mismatch = confirm.length > 0 && confirm !== next;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current)
      return setNotice({
        ok: false,
        text: "Please enter your current password.",
      });
    if (passed < checks.length)
      return setNotice({
        ok: false,
        text: "The new password must meet all the security requirements below.",
      });
    if (next === current)
      return setNotice({
        ok: false,
        text: "The new password cannot be the same as your current password.",
      });
    if (next !== confirm)
      return setNotice({ ok: false, text: "The new passwords do not match." });

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
      setNotice({
        ok: true,
        text: "Password updated successfully. Your new credentials are now active.",
      });
    } catch (err) {
      setNotice({
        ok: false,
        text:
          err instanceof Error
            ? err.message
            : "Could not update the password.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="Change Portal Password"
      description="Ensure your account uses a strong, unique password to safeguard regulatory decisions."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Current Password">
          <PasswordInput
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New Password">
            <PasswordInput
              value={next}
              onChange={setNext}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm New Password">
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              invalid={mismatch}
            />
            {mismatch && (
              <p className="mt-1 text-xs text-red-600">
                Passwords do not match.
              </p>
            )}
          </Field>
        </div>

        {next && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                <div
                  className={`h-1.5 rounded-full transition-all ${strength.cls}`}
                  style={{ width: `${(passed / checks.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-700">
                {strength.label}
              </span>
            </div>
            <ul className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
              {checks.map((c) => (
                <li
                  key={c.label}
                  className={`flex items-center gap-1.5 ${
                    c.ok ? "text-emerald-700 font-medium" : "text-slate-500"
                  }`}
                >
                  <Check
                    className={`h-3.5 w-3.5 ${
                      c.ok ? "text-emerald-600" : "opacity-30"
                    }`}
                  />
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <SubmitRow
          busy={busy}
          label="Update Password"
          icon={<KeyRound className="h-4 w-4" />}
          notice={notice}
        />
      </form>
    </Card>
  );
}

/* --------------------------- Preferences Card --------------------------- */

function PreferencesCard() {
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [capacityWarnings, setCapacityWarnings] = useState(true);
  const [complianceDigest, setComplianceDigest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<Notice>(null);

  const savePreferences = () => {
    setSaving(true);
    setSavedNotice(null);
    setTimeout(() => {
      setSaving(false);
      setSavedNotice({
        ok: true,
        text: "Regional alert preferences updated.",
      });
    }, 400);
  };

  return (
    <Card
      title="Regulatory Notification Preferences"
      description="Configure real-time notifications for exceptions and capacity alerts in your assigned zone."
    >
      <div className="space-y-4">
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50/60 cursor-pointer">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-slate-900">
              Critical Dual-Enrollment Discrepancies
            </span>
            <p className="text-xs text-slate-500">
              Receive high-priority alerts when concurrent student enrollment flags are detected.
            </p>
          </div>
          <input
            type="checkbox"
            checked={criticalAlerts}
            onChange={(e) => setCriticalAlerts(e.target.checked)}
            className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50/60 cursor-pointer">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-slate-900">
              Approved Intake Quota Exceeded Alerts
            </span>
            <p className="text-xs text-slate-500">
              Notify immediately when an institution enrolls more candidates than permitted by AICTE quota.
            </p>
          </div>
          <input
            type="checkbox"
            checked={capacityWarnings}
            onChange={(e) => setCapacityWarnings(e.target.checked)}
            className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50/60 cursor-pointer">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-slate-900">
              Weekly Regional Compliance Digest
            </span>
            <p className="text-xs text-slate-500">
              Receive a weekly summary email of pending adjudication flags and hearings in your zone.
            </p>
          </div>
          <input
            type="checkbox"
            checked={complianceDigest}
            onChange={(e) => setComplianceDigest(e.target.checked)}
            className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </label>

        <div className="pt-2">
          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Alert Preferences
          </button>
          <NoticeLine notice={savedNotice} />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Small Pieces ------------------------------ */

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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="mb-6 mt-1 text-sm text-slate-600">{description}</p>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
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
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {busy ? "Saving..." : label}
      </button>
      <NoticeLine notice={notice} />
    </div>
  );
}

function NoticeLine({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-sm font-medium ${
        notice.ok ? "text-emerald-700" : "text-red-600"
      }`}
    >
      {notice.text}
    </p>
  );
}

"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Rocket,
} from "lucide-react";

/* ----------------------------- API + ROUTES (GUESSES - adjust to your backend) ----------------------------- */

// GUESS: POST { password } -> backend sets the password and emails the credentials
const API_RESET = (id: string) =>
  `/api/v1/admin/users/${encodeURIComponent(id)}/reset-password`;

const USERS_ROUTE = "/aicte-admin/user-management"; // GUESS: where "Back" goes

// GUESS: role designation sent by the Manage popup -> backend role name
const ROLE_DESIGNATION: Record<string, string> = {
  "AICTE OFFICER": "ROLE_AICTE_OFFICER",
  "UNIVERSITY ADMIN": "ROLE_UNIVERSITY_ADMIN",
};

/* ----------------------------- Password helpers ----------------------------- */

const MIN_LENGTH = 10;

const isStrong = (value: string) =>
  value.length >= MIN_LENGTH &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /\d/.test(value);

// Unbiased random integer in [0, max)
function randomInt(max: number) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % max;
}

function generatePassword(length = 14) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*?";
  const all = upper + lower + digits + symbols;

  const pick = (set: string) => set[randomInt(set.length)];

  // Guarantee one of each required type, fill the rest, then shuffle.
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];

  while (chars.length < length) {
    chars.push(pick(all));
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

/* ----------------------------- Page ----------------------------- */

export default function ResetPasswordPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();

  const id = params.get("id") ?? "";
  const name = params.get("name") ?? "this official";
  const email = params.get("email") ?? "";
  const roleParam = params.get("role") ?? "";
  const designation = ROLE_DESIGNATION[roleParam] ?? roleParam;

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [generate, setGenerate] = useState(false);
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);

  const invalid = touched && !isStrong(password);

  function toggleGenerate() {
    if (generate) {
      setGenerate(false);
      setPassword("");
      setShow(false);
      setCopied(false);
    } else {
      setGenerate(true);
      setPassword(generatePassword());
      setShow(true);
      setTouched(false);
      setCopied(false);
    }
  }

  function regenerate() {
    setPassword(generatePassword());
    setCopied(false);
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setServerError("Couldn't copy to the clipboard. Select the password and copy it manually.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setServerError("");
    setTouched(true);

    if (!isStrong(password)) return;

    setSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("apaarsetu_access_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(API_RESET(id), {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        let message = `Password reset failed (HTTP ${res.status}). Nothing was changed.`;

        try {
          const body = await res.json();
          if (body?.message) message = String(body.message);
        } catch {
          // Response was not JSON.
        }

        setServerError(message);
        return;
      }

      // Don't keep the password in memory once the server has accepted it.
      setPassword("");
      setGenerate(false);
      setShow(false);
      setDone(true);
    } catch {
      setServerError("Can't reach the server on port 8081. Nothing was changed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-extrabold tracking-tight">Reset Password</h1>
        <p className="mt-2 max-w-3xl text-lg text-slate-600">
          Set a new secure password for this account. The updated credentials are
          emailed to the official.
        </p>

        {/* No official selected */}
        {!id && (
          <section
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
          >
            <p className="font-semibold">No official selected.</p>
            <p className="mt-1 text-sm">
              Open User Management, click Manage on an official, then choose Reset password.
            </p>
            <Link
              href={USERS_ROUTE}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </section>
        )}

        {/* Success */}
        {id && done && (
          <section
            role="status"
            className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-lg font-bold text-emerald-900">
                  Password reset for {name}
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  {email
                    ? `The new credentials were emailed to ${email}.`
                    : "The new credentials were emailed to the official."}
                </p>
              </div>
            </div>

            <Link
              href={USERS_ROUTE}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to User Management
            </Link>
          </section>
        )}

        {/* Form */}
        {id && !done && (
          <form onSubmit={onSubmit} noValidate className="mt-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-extrabold uppercase tracking-tight">
                Security &amp; Regulatory Access
              </h2>

              <p className="mt-3 text-sm text-slate-600">
                Resetting password for{" "}
                <span className="font-semibold text-slate-900">{name}</span>
                {email && <span> ({email})</span>}
              </p>

              <p className="mt-6 text-lg font-semibold text-slate-800">
                Access Level &amp; Role Designation
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {designation && (
                  <code className="mr-2 rounded-md bg-indigo-100 px-2 py-1 font-mono text-xs font-bold text-indigo-800">
                    {designation}
                  </code>
                )}
                (taken from the selected account)
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-[3fr_2fr] md:items-start">
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-lg font-semibold text-slate-800"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <input
                      id="new-password"
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      readOnly={generate}
                      onChange={(event) => setPassword(event.target.value)}
                      onBlur={() => setTouched(true)}
                      aria-invalid={invalid}
                      aria-describedby="password-help"
                      className={`w-full rounded-xl border bg-white py-3.5 pl-4 pr-12 font-mono text-sm outline-none focus:ring-2 ${
                        invalid
                          ? "border-red-400 focus:ring-red-100"
                          : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
                      } ${generate ? "bg-slate-50" : ""}`}
                    />

                    <button
                      type="button"
                      onClick={() => setShow((value) => !value)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    >
                      {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {generate && (
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <button
                        type="button"
                        onClick={regenerate}
                        className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 hover:underline"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Regenerate
                      </button>

                      <button
                        type="button"
                        onClick={copyPassword}
                        className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 hover:underline"
                      >
                        <Copy className="h-4 w-4" />
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}

                  <p
                    id="password-help"
                    className={`mt-2 text-sm ${
                      invalid ? "font-medium text-red-600" : "text-slate-500"
                    }`}
                  >
                    Use at least {MIN_LENGTH} characters with upper case, lower
                    case and a number, or generate one.
                  </p>
                </div>

                {/* Generate toggle */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 md:mt-[2.35rem]">
                  <button
                    id="generate-switch"
                    type="button"
                    role="switch"
                    aria-checked={generate}
                    onClick={toggleGenerate}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${
                      generate ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        generate ? "translate-x-5" : ""
                      }`}
                    />
                  </button>

                  <label
                    htmlFor="generate-switch"
                    className="cursor-pointer text-sm font-medium text-slate-800"
                  >
                    Generate Secure Password{" "}
                    <span className="text-slate-400">&amp;</span>{" "}
                    <span className="text-indigo-700">Reveal</span>
                  </label>
                </div>
              </div>

              <div role="alert" aria-live="assertive">
                {serverError && (
                  <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {serverError}
                  </p>
                )}
              </div>
            </section>

            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <Link
                href={USERS_ROUTE}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Reset Password &amp; Email Credentials
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

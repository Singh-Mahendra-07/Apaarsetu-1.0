"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AicteloginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const email = userId.trim();
      const pass = password;

      const response = await login(email, pass);

      if (response.user.role !== "ROLE_AICTE_ADMIN") {
        throw new Error(
          `Unauthorized role: ${response.user.role}. This portal is restricted to AICTE Admins.`
        );
      }

      router.push("/aicte-admin");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please verify your credentials and backend status.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    setUserId("");
    setPassword("");
    setError("");
    setShowPassword(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl md:grid-cols-2">
        {/* Left panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-800 via-blue-900 to-slate-950 p-10 text-white md:flex">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <ShieldCheck size={32} />
            </div>

            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Government Administration
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">
              AICTE Central Portal
            </h1>

            <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/80">
              National oversight, regulatory metrics, governance, audit logs, and institution registration.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold text-blue-200">
                Seeded Test Account:
              </p>
              <p className="mt-1 font-mono text-sm text-white">
                admin@aicte.gov.in / Admin@123
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-xs font-medium text-blue-200">
                  Backend API Live Connection (Port 8081)
                </p>
                <p className="mt-0.5 text-xs text-blue-100/60">
                  Spring Security JWT + MongoDB
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right panel */}
        <section className="p-6 sm:p-10 md:p-12">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <div className="rounded-xl bg-blue-600 p-2 text-white">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">AICTE Admin</h1>
              <p className="text-xs text-slate-500">Secure Login Portal</p>
            </div>
          </div>

          <div className="mb-8">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              ROLE_AICTE_ADMIN
            </span>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your administrator credentials to access the central AICTE dashboard.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Authentication error
                  </p>
                  <p className="mt-1 text-sm text-red-700">{error}</p>

                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-800 underline underline-offset-4 hover:text-red-950"
                  >
                    <RotateCcw size={15} />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="userId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email / User ID
              </label>

              <div className="relative">
                <UserRound
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="userId"
                  name="userId"
                  type="text"
                  autoComplete="username"
                  placeholder="admin@aicte.gov.in"
                  value={userId}
                  onChange={(event) => {
                    setUserId(event.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Verifying with Spring Boot...
                </>
              ) : (
                <>
                  Login to AICTE Portal
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">SECURE PORTAL</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Government Administrative Clearance
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Authenticated via stateless JWT token with Spring Security RBAC.
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            AICTE Student Data Management & Verification System
          </p>
        </section>
      </div>
    </main>
  );
}

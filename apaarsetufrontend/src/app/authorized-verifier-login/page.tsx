'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  FileCheck2,
  BadgeCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AuthorizedVerifierLogin() {
  const router = useRouter();
  const { login } = useAuth();

  const [verifierId, setVerifierId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = verifierId.trim();
      const pass = password;

      const response = await login(email, pass);

      if (response.user.role !== 'ROLE_AUTHORIZED_VERIFIER') {
        throw new Error(
          `Unauthorized role: ${response.user.role}. This portal is restricted to Authorized Verifiers.`
        );
      }

      router.push('/authorized-verifier');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please check your verifier credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">

        {/* Left information panel */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 p-8 text-white md:p-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-indigo-400/10" />

          <div className="relative z-10">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
              <BadgeCheck size={30} />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Third-Party Verification
            </p>

            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              Authorized Credential Verification Portal
            </h1>

            <p className="mt-4 max-w-md text-sm text-blue-100">
              Cryptographic QR code verification, DPDP consent-gated APAAR ID verification, and tamper-proof academic background check validation.
            </p>
          </div>

          <div className="relative z-10 mt-10 space-y-3">
            <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-xs">
              <p className="text-xs font-semibold text-blue-200">Seeded Verifier Account:</p>
              <p className="font-mono text-sm text-white">verifier@tcs.com / Verifier@123</p>
              <p className="text-xs text-blue-300">TCS Background Verification Agency</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-blue-200">
                Connected to Spring Boot REST Backend (Port 8081)
              </p>
            </div>
          </div>
        </section>

        {/* Right form panel */}
        <section className="flex flex-col justify-center p-8 md:p-12">
          <div className="mb-8">
            <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              ROLE_AUTHORIZED_VERIFIER
            </span>

            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Verifier Sign In
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sign in with your authorized agency credentials.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="font-medium">Authentication failed</p>
                <p className="mt-0.5 text-xs text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="verifierId"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Verifier Email / ID
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="verifierId"
                  name="verifierId"
                  type="text"
                  placeholder="verifier@tcs.com"
                  value={verifierId}
                  onChange={(e) => setVerifierId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-900 py-3 font-medium text-white transition hover:bg-indigo-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying Agency Credentials...
                </>
              ) : (
                <>
                  Login to Verification Portal
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            AICTE Student Data Management & Verification System
          </p>
        </section>
      </div>
    </main>
  );
}

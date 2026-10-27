'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  LockKeyhole,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function InstitutionAdminLogin() {
  const router = useRouter();
  const { login } = useAuth();

  const [institutionId, setInstitutionId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = institutionId.trim();
      const pass = password.trim();

      const response = await login(email, pass);

      if (response.user.role !== 'ROLE_INSTITUTION_ADMIN') {
        throw new Error(
          `Unauthorized role: ${response.user.role}. This portal is restricted to Institution Administrators.`
        );
      }

      router.push('/institution-admin');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Invalid institution credentials. Please check your email and password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">

        {/* Left panel */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-blue-900 to-indigo-700 p-8 text-white md:p-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-blue-400/10" />

          <div className="relative z-10">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
              <Building2 size={30} />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Institution Governance
            </p>

            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              Institution Administration Portal
            </h1>

            <p className="mt-4 max-w-md text-sm text-blue-100">
              Manage AICTE sanctioned seat quotas, review and approve student enrollment batches, and govern ERP integration API keys.
            </p>
          </div>

          <div className="relative z-10 mt-10 space-y-3">
            <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-xs">
              <p className="text-xs font-semibold text-blue-200">Seeded Institution Admin:</p>
              <p className="font-mono text-sm text-white">admin@ditm.ac.in / InstAdmin@123</p>
              <p className="text-xs text-blue-300">Delhi Institute of Technology (AICTE-INST-1001)</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-blue-200">
                Connected to Spring Boot REST Backend (Port 8081)
              </p>
            </div>
          </div>
        </section>

        {/* Right panel */}
        <section className="flex flex-col justify-center p-8 md:p-12">
          <div className="mb-8">
            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              ROLE_INSTITUTION_ADMIN
            </span>

            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Administrator Login
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sign in with your registered college administrator account.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="font-medium">Sign in failed</p>
                <p className="mt-0.5 text-xs text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="institutionId"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Institution Admin Email / ID
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="institutionId"
                  name="institutionId"
                  type="text"
                  placeholder="admin@ditm.ac.in"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Login to Portal
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

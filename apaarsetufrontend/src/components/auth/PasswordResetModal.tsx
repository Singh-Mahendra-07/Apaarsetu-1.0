'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  LockKeyhole,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const all = upper + lower + digits + symbols;
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;

  const res = [
    upper[rnd(upper.length)],
    upper[rnd(upper.length)],
    lower[rnd(lower.length)],
    lower[rnd(lower.length)],
    digits[rnd(digits.length)],
    digits[rnd(digits.length)],
    symbols[rnd(symbols.length)],
    symbols[rnd(symbols.length)],
  ];
  while (res.length < 16) {
    res.push(all[rnd(all.length)]);
  }
  for (let i = res.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res.join('');
}

export default function PasswordResetModal() {
  const { user, resetFirstTimePassword, logout } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [autoGen, setAutoGen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Security Lockout: prevent Escape key and trap history navigation
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handlePopState = () => {
      // Force stay on current route during lockout
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Validation criteria
  const hasMinLength = password.length >= 10;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const toggleAutoGen = () => {
    if (!autoGen) {
      const generated = generateSecurePassword();
      setPassword(generated);
      setConfirmPassword(generated);
      setShowPassword(true);
      setShowConfirmPassword(true);
      setAutoGen(true);
      setError(null);
    } else {
      setPassword('');
      setConfirmPassword('');
      setAutoGen(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setError(null);
    setLoading(true);

    try {
      await resetFirstTimePassword(password, confirmPassword);
      setSuccess(true);
      // Wait a moment for UX feedback, then unlocked state takes effect automatically
      setTimeout(() => {
        // State updated in AuthContext unlocks everything seamlessly
      }, 1000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to update permanent password. Please verify requirements and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mandatory-reset-title"
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-indigo-200/30 bg-white shadow-2xl transition-all">
        {/* Top Decorative Gradient */}
        <div className="h-3 w-full bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
              <ShieldAlert className="h-8 w-8 animate-pulse text-amber-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-800 border border-amber-200">
                  Security Policy Enforced
                </span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                  Mandatory Initialization
                </span>
              </div>
              <h2
                id="mandatory-reset-title"
                className="mt-1 text-2xl font-bold tracking-tight text-slate-900"
              >
                Set Permanent Password
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                You logged in with a system-generated temporary credential. Per AICTE
                Cybersecurity Mandates, you must establish a permanent secure password before
                accessing platform registries.
              </p>
            </div>
          </div>

          {/* User Account Info Chip */}
          {user && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
              <div className="flex items-center gap-2.5">
                <UserCheck className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="font-semibold text-slate-900">{user.fullName || user.email}</p>
                  <p className="font-mono text-slate-500">{user.email}</p>
                </div>
              </div>
              <span className="rounded-md bg-indigo-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-indigo-800">
                {user.role}
              </span>
            </div>
          )}

          {/* Success Banner */}
          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 animate-bounce" />
              <h3 className="mt-2 text-lg font-bold text-emerald-900">Password Established!</h3>
              <p className="mt-1 text-sm text-emerald-700">
                Your one-time password has been permanently destroyed and full platform privileges
                have been unlocked.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Generator Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-700">
                    Generate Secure Password &amp; Reveal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleAutoGen}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${autoGen ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${autoGen ? 'left-[22px]' : 'left-0.5'
                      }`}
                  />
                </button>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  New Permanent Password
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setAutoGen(false);
                    }}
                    placeholder="Enter at least 10 characters"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Confirm Permanent Password
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <LockKeyhole className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your permanent password"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Policy Validation Checklist */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-700">Password Requirements:</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                  <CheckItem met={hasMinLength} label="At least 10 characters" />
                  <CheckItem met={hasUppercase} label="1+ uppercase letter (A-Z)" />
                  <CheckItem met={hasLowercase} label="1+ lowercase letter (a-z)" />
                  <CheckItem met={hasNumber} label="1+ number (0-9)" />
                  <div className="col-span-2">
                    <CheckItem met={passwordsMatch} label="Passwords match exactly" />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>

                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Securing Account...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Establish Password &amp; Unlock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${met ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
          }`}
      >
        <CheckCircle2 className="h-3 w-3" />
      </div>
      <span className={met ? 'font-medium text-emerald-800' : 'text-slate-500'}>{label}</span>
    </div>
  );
}

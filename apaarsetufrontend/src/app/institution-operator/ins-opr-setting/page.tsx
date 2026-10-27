"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Mail,
  ShieldCheck,
  Building2,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Key,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import InstitutionOperatorProfileDropdown from "@/components/layout/InstitutionOperatorProfileDropdown";

export default function OperatorSettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cachedProfile = mounted ? apiClient.getUserProfile() : null;
  const operatorName = user?.fullName || cachedProfile?.fullName || "Suman Lata";
  const userEmail = user?.email || cachedProfile?.email || "operator@ditm.ac.in";
  const instId = user?.institutionId || cachedProfile?.institutionId || "AICTE-INST-1001";
  const instName =
    user?.institutionName ||
    cachedProfile?.institutionName ||
    "Delhi Institute of Technology & Management";

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setToast({ ok: false, text: "Current password is required." });
      return;
    }
    if (newPassword.length < 8) {
      setToast({ ok: false, text: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ ok: false, text: "New password and confirmation do not match." });
      return;
    }

    setBusy(true);
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setToast({ ok: true, text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password change failed.";
      setToast({ ok: false, text: msg });
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      router.push("/officials-login");
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-xl ring-1 transition animate-in fade-in slide-in-from-bottom-4 ${
            toast.ok
              ? "bg-slate-900 text-white ring-slate-800"
              : "bg-red-600 text-white ring-red-700"
          }`}
        >
          {toast.ok ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-white" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">
              <Settings className="h-3.5 w-3.5 text-violet-300" />
              Account Preferences
            </span>
            <span className="text-xs text-slate-400">
              {instName} ({instId})
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Operator Profile &amp; Security Settings
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Manage your credentials, view institution scope, and update portal security parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <InstitutionOperatorProfileDropdown />
        </div>
      </header>

      {/* Main Grid: Left Profile Card, Right Security Form */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Identity Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-2xl font-bold text-white shadow-md mb-4">
              {(operatorName || "O")[0]}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{operatorName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{userEmail}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 border border-violet-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              ROLE_INSTITUTION_OPERATOR
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                Institution Assignment
              </p>
              <p className="font-semibold text-slate-800 mt-0.5">{instName}</p>
              <p className="text-slate-500 font-mono mt-0.5">{instId}</p>
            </div>

            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                Assigned Responsibilities
              </p>
              <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-600">
                <li>Bulk Student CSV Upload &amp; Parsing</li>
                <li>APAAR 12-Digit Formatting &amp; Verification</li>
                <li>Inline Correction of Batch Discrepancies</li>
                <li>Candidate Registry Search</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100/60 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out of Portal</span>
            </button>
          </div>
        </div>

        {/* Change Password & Security Settings */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-600" />
              <span>Change Portal Password</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ensure your account uses a strong, unique password to prevent unauthorized student record modifications.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

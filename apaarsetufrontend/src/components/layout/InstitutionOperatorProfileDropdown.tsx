"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Settings, LogOut, UserRound, Mail, ShieldCheck, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";

export default function InstitutionOperatorProfileDropdown() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cachedProfile = mounted ? apiClient.getUserProfile() : null;
  const operatorName = (mounted ? (user?.fullName || cachedProfile?.fullName) : null) || "Operator";
  const userEmail = (mounted ? (user?.email || cachedProfile?.email) : null) || "operator@ditm.ac.in";
  const instId = (mounted ? (user?.institutionId || cachedProfile?.institutionId) : null) || "AICTE-INST-1001";
  const employeeId =
    (mounted ? (user?.employeeId || cachedProfile?.employeeId) : null) ||
    (user?.id
      ? `OPR-${user.id.slice(-6).toUpperCase()}`
      : instId
      ? `OPR-${instId.replace(/[^0-9]/g, "") || "1001"}`
      : "OPR-1001");

  const avatarInitial = (operatorName || "O")[0].toUpperCase();

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      router.push("/officials-login");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="Open operator profile menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-sm shadow-xs transition hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-xs">
          {avatarInitial}
        </span>
        <span className="max-w-[140px] truncate font-medium text-slate-900">
          {operatorName}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            menuOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {menuOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Identity Information Header */}
          <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-indigo-50/40 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white shadow-sm">
                {avatarInitial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {operatorName}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate">{userEmail}</span>
                </div>
              </div>
            </div>

            {/* Badges for Role & Employee ID */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60">
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 border border-violet-200/50">
                <ShieldCheck className="h-3 w-3" />
                Operator
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                <UserRound className="h-3 w-3 text-slate-400" />
                ID: {employeeId}
              </span>
              {instId && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  {instId}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Menu Links */}
          <div className="p-2 space-y-1">
            <Link
              href="/institution-operator/ins-opr-setting"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              <span>Profile & Account Settings</span>
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Sign Out of Portal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

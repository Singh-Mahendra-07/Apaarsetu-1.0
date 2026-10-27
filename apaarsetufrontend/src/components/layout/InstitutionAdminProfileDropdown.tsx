"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Settings, LogOut, UserRound, Mail, ShieldCheck, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";

export default function InstitutionAdminProfileDropdown() {
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
  const adminName = (mounted ? (user?.fullName || cachedProfile?.fullName) : null) || "Admin";
  const userEmail = (mounted ? (user?.email || cachedProfile?.email) : null) || "admin@ditm.ac.in";
  const instId = (mounted ? (user?.institutionId || cachedProfile?.institutionId) : null) || "";
  const employeeId =
    (mounted ? (user?.employeeId || cachedProfile?.employeeId) : null) ||
    (user?.id
      ? `EMP-${user.id.slice(-6).toUpperCase()}`
      : instId
      ? `EMP-${instId.replace(/[^0-9]/g, "") || "1001"}`
      : "EMP-1001");

  const avatarInitial = (adminName || "A")[0].toUpperCase();

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
        aria-label="Open admin profile menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors shadow-2xs"
      >
        {mounted ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-xs">
            {avatarInitial}
          </span>
        ) : (
          <span className="h-6 w-6 animate-pulse rounded-full bg-slate-200" />
        )}

        {mounted ? (
          <span className="max-w-[140px] truncate font-medium text-slate-900">
            {adminName}
          </span>
        ) : (
          <span className="inline-block h-4 w-20 animate-pulse rounded bg-slate-200" />
        )}

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
          <div className="border-b border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-sm">
                {avatarInitial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  Institution Administrator
                </p>
                <p className="truncate text-sm font-bold text-slate-900" title={adminName}>
                  {adminName}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 rounded-xl border border-slate-200/80 bg-white p-2.5 text-xs text-slate-700 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                  <UserRound className="h-3.5 w-3.5 text-slate-400" />
                  Name:
                </span>
                <span className="truncate font-semibold text-slate-900">{adminName}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Email:
                </span>
                <span className="truncate font-mono text-[11px] font-medium text-slate-700" title={userEmail}>
                  {userEmail}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                  Employee ID:
                </span>
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-indigo-700">
                  {employeeId}
                </span>
              </div>
              {instId && (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    Institution:
                  </span>
                  <span className="truncate font-mono text-[11px] font-medium text-slate-600">
                    {instId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="p-2 space-y-1 bg-white">
            <Link
              href="/institution-admin/ins-settings"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              <span>Profile Settings</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

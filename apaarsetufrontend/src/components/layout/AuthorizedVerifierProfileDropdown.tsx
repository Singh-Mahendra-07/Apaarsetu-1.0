"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Settings, LogOut, Building2, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";

export default function AuthorizedVerifierProfileDropdown() {
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
  const verifierName = (mounted ? (user?.fullName || cachedProfile?.fullName) : null) || "Authorized Verifier";
  const userEmail = (mounted ? (user?.email || cachedProfile?.email) : null) || "verifier@authdesk.org";
  const agencyName = (mounted ? (user?.institutionId || cachedProfile?.institutionId) : null) || "Academic AuthDesk Agency";
  const avatarInitial = (verifierName || "V")[0].toUpperCase();

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="Open verifier profile menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors shadow-2xs"
      >
        {mounted ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-xs">
            {avatarInitial}
          </span>
        ) : (
          <span className="h-6 w-6 animate-pulse rounded-full bg-slate-200" />
        )}

        {mounted ? (
          <span className="max-w-[140px] truncate font-medium text-slate-900">
            {verifierName}
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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-sm font-bold text-white shadow-sm">
                {avatarInitial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Accredited Verifier
                </p>
                <p className="truncate text-sm font-bold text-slate-900">
                  {verifierName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {userEmail}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate max-w-[170px]">{agencyName}</span>
              </div>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="p-2 space-y-1">
            <Link
              href="/authorized-verifier/myprofile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <UserRound className="h-4 w-4 text-slate-400" />
              <span>Verifier Accreditation Profile</span>
            </Link>

            <Link
              href="/authorized-verifier/veri-setting"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Security &amp; Webhook Settings</span>
            </Link>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

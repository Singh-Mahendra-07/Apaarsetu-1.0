"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  UserRound,
  Mail,
  ShieldCheck,
  Building2,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function OfficerProfileDropdown() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const employeeId =
    mounted && user?.id
      ? `AICTE-RO-${user.id.slice(-6).toUpperCase()}`
      : null;

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  };

  const handleSettings = () => {
    setMenuOpen(false);
    router.push("/aicte-officer/sys-Setting");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-indigo-300 hover:bg-slate-50 focus:outline-hidden"
      >
        {mounted && user?.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={user.fullName || "Officer"}
            className="h-7 w-7 rounded-full object-cover ring-2 ring-indigo-600/30 shadow-xs"
          />
        ) : mounted && user?.fullName ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white shadow-xs">
            {user.fullName.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />
        )}
        <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate max-w-[140px]">
          {mounted && user?.fullName ? (
            user.fullName
          ) : (
            <span className="inline-block h-3.5 w-16 animate-pulse rounded bg-slate-200 align-middle" />
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform ${
            menuOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close profile menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div
            role="menu"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Top user profile card */}
            <div className="border-b border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-center gap-3">
                {mounted && user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.fullName || "Officer"}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-indigo-600/30 shadow-md"
                  />
                ) : mounted && user?.fullName ? (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-white font-bold text-base shadow-md">
                    {user.fullName.slice(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-200 shadow-md" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">
                    {mounted && user?.fullName ? (
                      user.fullName
                    ) : (
                      <span className="inline-block h-4 w-28 animate-pulse rounded bg-slate-200" />
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {mounted && user?.region
                      ? `${user.region} ZONE OFFICER`
                      : "REGIONAL OFFICER"}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {mounted && user?.status ? user.status : "ACTIVE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Officer details: Name, Email, Employee ID, Zone */}
            <div className="space-y-3 p-4 text-xs">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    Officer Name
                  </p>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {mounted && user?.fullName ? (
                      user.fullName
                    ) : (
                      <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-slate-200" />
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    Email Address
                  </p>
                  <p className="text-xs font-semibold text-slate-900 break-all">
                    {mounted && user?.email ? (
                      user.email
                    ) : (
                      <span className="inline-block h-3 w-32 animate-pulse rounded bg-slate-200" />
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    Employee / Officer ID
                  </p>
                  <p className="text-xs font-mono font-bold text-indigo-700">
                    {employeeId || (
                      <span className="inline-block h-3 w-20 animate-pulse rounded bg-slate-200" />
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    Assigned Jurisdiction
                  </p>
                  <p className="text-xs font-semibold text-slate-700">
                    {mounted && user?.region
                      ? `${user.region} ZONE`
                      : "REGIONAL JURISDICTION"}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile actions: Settings and Logout */}
            <div className="border-t border-slate-100 p-2 space-y-1">
              <button
                type="button"
                onClick={handleSettings}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                Profile Settings
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Settings } from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    path: "/institution-operator",
    icon: "▦",
  },
  {
    label: "Institution Profile",
    path: "/institution-operator/institution",
    icon: "▤",
  },
  {
    label: "Student Management",
    path: "/institution-operator/student",
    icon: "♙",
  },
  {
    label: "Bulk Student Upload",
    path: "/institution-operator/bulk",
    icon: "⇧",
  },
  {
    label: "APAAR Validation",
    path: "/institution-operator/apaar",
    icon: "✓",
  },
  {
    label: "Intake Management",
    path: "/institution-operator/intake",
    icon: "◷",
  },
  {
    label: "Submissions",
    path: "/institution-operator/submission",
    icon: "▣",
  },
  {
    label: "Submission History",
    path: "/institution-operator/history",
    icon: "↺",
  },
  {
    label: "Reports",
    path: "/institution-operator/report",
    icon: "▥",
  },
  {
    label: "Audit Logs",
    path: "/institution-operator/audit",
    icon: "♧",
  },
  {
    label: "Settings",
    path: "/institution-operator/ins-opr-setting",
    icon: "⚙",
  },
];

export default function InstitutionOperatorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push("/officials-login");
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[275px] flex-col justify-between overflow-y-auto bg-slate-950 p-5 text-white">
      <div>
        {/* Sidebar Header */}
        <div className="mb-6 border-b border-slate-800 pb-5">
          <h2 className="text-xl font-bold">
            🎓 APAAR Portal
          </h2>

          <p className="text-sm text-slate-400">
            Institution Operator
          </p>
        </div>

        {/* Section Heading */}
        <p className="mb-3 text-xs font-bold tracking-widest text-slate-500">
          INSTITUTION OPERATIONS
        </p>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const active = mounted && (
              item.path === "/institution-operator"
                ? pathname === item.path
                : pathname === item.path ||
                  pathname.startsWith(item.path + "/")
            );

            return (
              <Link
                key={item.path}
                href={item.path}
                suppressHydrationWarning
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition ${
                  active
                    ? "bg-violet-600 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="text-base">
                  {item.icon}
                </span>

                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Logout Section */}
      <div className="mt-6 border-t border-slate-800 pt-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-900/80 p-2.5 border border-slate-800/80">
          {mounted && user?.fullName ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 font-bold text-xs text-white shadow-md">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-800" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">
              {mounted && user?.fullName ? (
                user.fullName
              ) : (
                <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-slate-800" />
              )}
            </p>
            <p className="truncate text-[10px] text-slate-400">
              {mounted && user?.email ? (
                user.email
              ) : (
                <span className="inline-block h-2.5 w-28 animate-pulse rounded bg-slate-800" />
              )}
            </p>
            <span className="mt-0.5 inline-block rounded-full bg-cyan-950/60 px-2 py-0.5 text-[9px] font-semibold text-cyan-300 border border-cyan-800/40">
              {mounted && user?.role ? user.role.replace("ROLE_", "") : "INSTITUTION_OPERATOR"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/institution-operator/ins-opr-setting"
            title="Operator Settings"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <Settings size={13} />
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-900/50 hover:text-red-200"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

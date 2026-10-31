
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Settings } from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    path: "/institution-admin",
    icon: "▦",
  },
  {
    label: "Institution Profile",
    path: "/institution-admin/institution",
    icon: "▤",
  },
  {
    label: "Bulk Student Upload",
    path: "/institution-admin/bulk",
    icon: "⇧",
  },
  {
    label: "APAAR Validation",
    path: "/institution-admin/apaar",
    icon: "✓",
  },
  {
    label: "Review & Approvals",
    path: "/institution-admin/review",
    icon: "☑",
  },
  {
    label: "Student Records",
    path: "/institution-admin/student",
    icon: "♧",
  },
  {
    label: "User Management",
    path: "/institution-admin/user",
    icon: "♙",
  },
  {
    label: "ERP API Keys",
    path: "/institution-admin/erp",
    icon: "⚿",
  },
  {
    label: "AICTE Submissions",
    path: "/institution-admin/aicte-sub",
    icon: "▣",
  },
  {
    label: "Reports & Analytics",
    path: "/institution-admin/reports",
    icon: "▥",
  },
  {
    label: "Audit Logs",
    path: "/institution-admin/audit",
    icon: "◷",
  },
  {
    label: "Settings",
    path: "/institution-admin/ins-settings",
    icon: "⚙",
  },
];

export default function InstitutionAdminSidebar() {
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
      router.push("/login");
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
            Institution Portal
          </p>
        </div>

        {/* Section Heading */}
        <p className="mb-3 text-xs font-bold tracking-widest text-slate-500">
          INSTITUTION CONTROL
        </p>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const active = mounted && (
              item.path === "/institution-admin"
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

      {/* Bottom Profile & Logout Section from apaarsetu-frontend02 */}
      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="truncate text-xs font-semibold text-white">
                {mounted && user?.fullName ? (
                  user.fullName
                ) : (
                  <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-slate-800" />
                )}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {mounted && user?.email ? (
                  user.email
                ) : (
                  <span className="inline-block h-2.5 w-28 animate-pulse rounded bg-slate-800" />
                )}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-blue-300">
                {mounted && user?.institutionId ? (
                  user.institutionId
                ) : (
                  <span className="inline-block h-2.5 w-16 animate-pulse rounded bg-slate-800" />
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/institution-admin/ins-settings"
                title="Settings"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <Settings size={16} />
              </Link>
              <button
                onClick={handleLogout}
                title="Logout"
                className="rounded-lg p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

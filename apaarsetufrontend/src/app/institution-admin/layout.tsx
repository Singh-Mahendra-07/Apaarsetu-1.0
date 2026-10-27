// "use client";

// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { useState } from "react";
// import {
//   LayoutDashboard,
//   Building2,
//   Users,
//   GraduationCap,
//   ShieldCheck,
//   ClipboardCheck,
//   FileText,
//   BarChart3,
//   History,
//   Settings,
//   LogOut,
//   Bell,
//   Menu,
//   X,
//   KeyRound,
// } from "lucide-react";
// import { useAuth } from "@/lib/auth-context";

// const navigation = [
//   { name: "Dashboard", href: "/institution-admin", icon: LayoutDashboard },
//   { name: "Institution Profile", href: "/institution-admin/profile", icon: Building2 },
//   { name: "User Management", href: "/institution-admin/users", icon: Users },
//   { name: "Student Records", href: "/institution-admin/students", icon: GraduationCap },
//   { name: "APAAR & Data Quality", href: "/institution-admin/data-quality", icon: ShieldCheck },
//   { name: "Review & Approvals", href: "/institution-admin/approvals", icon: ClipboardCheck },
//   { name: "AICTE Submissions", href: "/institution-admin/submissions", icon: FileText },
//   { name: "ERP API Keys", href: "/institution-admin/api-keys", icon: KeyRound },
//   { name: "Reports & Analytics", href: "/institution-admin/reports", icon: BarChart3 },
//   { name: "Audit Logs", href: "/institution-admin/audit-logs", icon: History },
//   { name: "Settings", href: "/institution-admin/settings", icon: Settings },
// ];

// export default function InstitutionAdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const { user, logout } = useAuth();
//   const [mobileOpen, setMobileOpen] = useState(false);

//   const handleLogout = async () => {
//     await logout();
//     router.push("/institution-login-admin");
//   };

//   const sidebar = (
//     <aside className="flex h-full flex-col bg-slate-950 text-slate-300">
//       <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
//         <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
//           <GraduationCap size={24} />
//         </div>
//         <div>
//           <h1 className="text-base font-bold text-white">APAAR Portal</h1>
//           <p className="text-xs text-slate-400">Institution Administration</p>
//         </div>
//       </div>

//       <div className="px-4 pt-6">
//         <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
//           Institution Control
//         </p>
//         <nav className="space-y-1">
//           {navigation.map((item) => {
//             const Icon = item.icon;
//             const active =
//               item.href === "/institution-admin"
//                 ? pathname === item.href
//                 : pathname === item.href || pathname.startsWith(`${item.href}/`);

//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 onClick={() => setMobileOpen(false)}
//                 className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
//                   active
//                     ? "bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/20"
//                     : "text-slate-400 hover:bg-white/5 hover:text-white"
//                 }`}
//               >
//                 <Icon size={18} />
//                 <span>{item.name}</span>
//               </Link>
//             );
//           })}
//         </nav>
//       </div>

//       <div className="mt-auto border-t border-white/10 p-4">
//         <div className="rounded-xl bg-white/5 p-3">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-xs font-semibold text-white">
//                 {user?.fullName || "Institution Principal"}
//               </p>
//               <p className="text-[11px] text-slate-400">
//                 {user?.email || "admin@ditm.ac.in"}
//               </p>
//               {user?.institutionId && (
//                 <p className="mt-0.5 font-mono text-[10px] text-blue-300">
//                   {user.institutionId}
//                 </p>
//               )}
//             </div>
//             <button
//               onClick={handleLogout}
//               title="Logout"
//               className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
//             >
//               <LogOut size={16} />
//             </button>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-100">
//       {/* Desktop Sidebar */}
//       <div className="hidden w-64 shrink-0 lg:block">{sidebar}</div>

//       {/* Mobile Drawer */}
//       {mobileOpen && (
//         <div className="fixed inset-0 z-50 flex lg:hidden">
//           <div
//             className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
//             onClick={() => setMobileOpen(false)}
//           />
//           <div className="relative z-10 w-64">{sidebar}</div>
//         </div>
//       )}

//       {/* Main Content Area */}
//       <div className="flex min-w-0 flex-1 flex-col">
//         <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
//           <div className="flex items-center gap-4">
//             <button
//               type="button"
//               onClick={() => setMobileOpen(!mobileOpen)}
//               className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
//             >
//               {mobileOpen ? <X size={20} /> : <Menu size={20} />}
//             </button>

//             <div>
//               <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
//                 AICTE Institution Governance
//               </p>
//               <h2 className="text-lg font-bold text-slate-900">
//                 College Administration Console
//               </h2>
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
//               <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
//               API Connected (Port 8081)
//             </span>

//             <button
//               type="button"
//               className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
//             >
//               <Bell size={18} />
//               <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
//                 2
//               </span>
//             </button>
//           </div>
//         </header>

//         <main className="flex-1 p-6 sm:p-8">{children}</main>
//       </div>
//     </div>
//   );
// }


// -------------------------

import InstitutionAdminSidebar from "@/components/layout/institutionAdminSidebar";

export default function InstitutionAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <InstitutionAdminSidebar />

      <main className="ml-[275px] min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}

// "use client";

// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { useState } from "react";
// import {
//   LayoutDashboard,
//   Building2,
//   ClipboardCheck,
//   ShieldCheck,
//   Gauge,
//   AlertTriangle,
//   FileBarChart,
//   History,
//   Users,
//   Settings,
//   Bell,
//   Search,
//   Menu,
//   X,
//   LogOut,
//   GraduationCap,
// } from "lucide-react";
// import { useAuth } from "@/lib/auth-context";

// const navigation = [
//   { label: "Dashboard", href: "/aicte-officer", icon: LayoutDashboard },
//   { label: "Institution Directory", href: "/aicte-officer/institutions", icon: Building2 },
//   { label: "Submission Queue", href: "/aicte-officer/submissions", icon: ClipboardCheck },
//   { label: "APAAR Verification", href: "/aicte-officer/apaar", icon: ShieldCheck },
//   { label: "Intake Monitoring", href: "/aicte-officer/intake", icon: Gauge },
//   { label: "Exception Management", href: "/aicte-officer/exceptions", icon: AlertTriangle },
//   { label: "Compliance Monitoring", href: "/aicte-officer/compliance", icon: ClipboardCheck },
//   { label: "Reports & Analytics", href: "/aicte-officer/reports", icon: FileBarChart },
//   { label: "Audit History", href: "/aicte-officer/audit-logs", icon: History },
//   { label: "Officer Management", href: "/aicte-officer/officers", icon: Users },
//   { label: "System Settings", href: "/aicte-officer/settings", icon: Settings },
// ];

// export default function AicteOfficerLayout({
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
//     router.push("/aicte-login-officer");
//   };

//   const sidebar = (
//     <aside className="flex h-full flex-col bg-slate-950 text-slate-300">
//       <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
//         <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white">
//           <GraduationCap size={26} />
//         </div>
//         <div>
//           <h1 className="font-bold text-white">APAAR Portal</h1>
//           <p className="text-xs text-slate-400">AICTE Nodal Officer Console</p>
//         </div>
//       </div>

//       <div className="px-4 pt-6">
//         <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
//           Central Administration
//         </p>
//         <nav className="space-y-1">
//           {navigation.map((item) => {
//             const Icon = item.icon;
//             const active =
//               item.href === "/aicte-officer"
//                 ? pathname === item.href
//                 : pathname === item.href || pathname.startsWith(`${item.href}/`);

//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 onClick={() => setMobileOpen(false)}
//                 className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
//                   active
//                     ? "bg-cyan-700 font-semibold text-white shadow-md shadow-cyan-700/20"
//                     : "text-slate-400 hover:bg-white/5 hover:text-white"
//                 }`}
//               >
//                 <Icon size={18} />
//                 <span>{item.label}</span>
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
//                 {user?.fullName || "AICTE Nodal Officer"}
//               </p>
//               <p className="text-[11px] text-slate-400">
//                 {user?.email || "officer@aicte.gov.in"}
//               </p>
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

//       {/* Main Content */}
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
//               <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
//                 Regulatory Compliance Division
//               </p>
//               <h2 className="text-lg font-bold text-slate-900">
//                 Nodal Verification Console
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
//               <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-700 text-[10px] font-bold text-white">
//                 5
//               </span>
//             </button>
//           </div>
//         </header>

//         <main className="flex-1 p-6 sm:p-8">{children}</main>
//       </div>
//     </div>
//   );
// }

// ----------------------------

import OfficerSidebar from "@/components/layout/AicteofficerSidebar";

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <OfficerSidebar />

      <main className="ml-[275px] min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}

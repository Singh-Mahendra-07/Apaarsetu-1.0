// "use client";

// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import {
//   LayoutDashboard,
//   Inbox,
//   SearchCheck,
//   AlertTriangle,
//   History,
//   FileChartColumn,
//   UserRound,
//   Settings,
//   ShieldCheck,
//   Bell,
//   Menu,
//   LogOut,
// } from "lucide-react";
// import { useAuth } from "@/lib/auth-context";

// const navigation = [
//   { label: "Dashboard", href: "/authorized-verifier", icon: LayoutDashboard },
//   { label: "Verify Student / QR", href: "/authorized-verifier/verify-student", icon: SearchCheck },
//   { label: "Verification Requests", href: "/authorized-verifier/requests", icon: Inbox },
//   { label: "Exceptions", href: "/authorized-verifier/exceptions", icon: AlertTriangle },
//   { label: "Verification History", href: "/authorized-verifier/history", icon: History },
//   { label: "Reports", href: "/authorized-verifier/reports", icon: FileChartColumn },
//   { label: "My Profile", href: "/authorized-verifier/profile", icon: UserRound },
//   { label: "Settings", href: "/authorized-verifier/settings", icon: Settings },
// ];

// export default function AuthorizedVerifierLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const { user, logout } = useAuth();

//   const handleLogout = async () => {
//     await logout();
//     router.push("/authorized-verifier-login");
//   };

//   return (
//     <div className="min-h-screen bg-slate-100 text-slate-900 md:flex">
//       <aside className="w-full shrink-0 bg-slate-950 text-white md:min-h-screen md:w-64 flex flex-col justify-between">
//         <div>
//           <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-6">
//             <div className="rounded-xl bg-blue-600 p-2">
//               <ShieldCheck size={25} />
//             </div>
//             <div>
//               <h1 className="font-bold">APAAR Verify</h1>
//               <p className="text-xs text-slate-400">Authorized Verifier</p>
//             </div>
//           </div>

//           <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col">
//             {navigation.map(({ label, href, icon: Icon }) => {
//               const active =
//                 pathname === href ||
//                 (href !== "/authorized-verifier" && pathname.startsWith(href));

//               return (
//                 <Link
//                   key={href}
//                   href={href}
//                   className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
//                     active
//                       ? "bg-blue-600 text-white"
//                       : "text-slate-300 hover:bg-slate-800 hover:text-white"
//                   }`}
//                 >
//                   <Icon size={18} />
//                   <span>{label}</span>
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>

//         <div className="m-4 rounded-xl border border-slate-800 bg-white/5 p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-xs text-slate-400">Signed in as</p>
//               <p className="mt-0.5 text-xs font-semibold text-white">
//                 {user?.fullName || "TCS Verifier"}
//               </p>
//               <p className="text-[11px] text-blue-300 truncate max-w-[140px]">
//                 {user?.email || "verifier@tcs.com"}
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
//       </aside>

//       <div className="min-w-0 flex-1 flex flex-col">
//         <header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-8">
//           <div className="flex items-center gap-3">
//             <div>
//               <h2 className="font-semibold text-slate-900">Credential Verification Portal</h2>
//               <p className="text-xs text-slate-500">
//                 AICTE Cryptographic Student Identity Verification
//               </p>
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
//               <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
//               API Connected (Port 8081)
//             </span>

//             <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
//               AV
//             </div>
//           </div>
//         </header>

//         <main className="mx-auto w-full max-w-[1600px] p-4 md:p-8 flex-1">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }


// ------------------------

import AuthorizedVerifierSidebar from "@/components/layout/authorizedVerifierSidebar";

export default function AuthorizedVerifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthorizedVerifierSidebar />

      <main className="ml-[275px] min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}

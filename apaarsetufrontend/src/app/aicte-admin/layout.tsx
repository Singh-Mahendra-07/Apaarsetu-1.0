
// import AicteAdminSidebar from "@/components/layout/AicteAdminSidebar";

// export default function AicteAdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="flex min-h-screen bg-slate-100">
//       <AicteAdminSidebar />

//       <main className="min-w-0 flex-1">
//         {children}
//       </main>
//     </div>
//   );
// }

// --------------------

import AicteAdminSidebar from "@/components/layout/AicteAdminSidebar";

export default function AicteAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <AicteAdminSidebar />

      <main className="ml-[275px] min-h-screen min-w-0">
        {children}
      </main>
    </div>
  );
}

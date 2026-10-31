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

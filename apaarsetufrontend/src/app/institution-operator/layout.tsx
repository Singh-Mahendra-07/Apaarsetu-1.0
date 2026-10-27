
import InstitutionOperatorSidebar from "@/components/layout/instituitionOperatorSidebar";

export default function InstitutionOperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <InstitutionOperatorSidebar />

      <main className="ml-[275px] min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}

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

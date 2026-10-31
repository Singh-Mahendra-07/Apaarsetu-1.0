"use client";

import { Suspense } from "react";
import OfficialsLogin from "@/components/OfficialsLogin";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </main>
      }
    >
      <OfficialsLogin />
    </Suspense>
  );
}


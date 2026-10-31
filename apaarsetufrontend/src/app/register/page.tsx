"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Lock, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
      <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <Lock className="h-3 w-3" /> Statutory Access Provisioning
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Account Provisioning Policy
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Public self-registration is disabled per AICTE National Registry Governance. Official accounts for institutions, nodal officers, and authorized verifiers are provisioned directly by AICTE Central Administration.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-left space-y-2">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-indigo-600" /> Institution Onboarding:
          </p>
          <p className="text-xs text-slate-500">
            If your college is approved by AICTE, contact your designated Regional Nodal Officer or submit an accreditation dossier for portal credential generation.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Proceed to Official Sign In</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

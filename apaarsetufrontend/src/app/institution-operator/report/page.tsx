"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PieChart,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi, apiClient } from "@/lib/api";
import InstitutionOperatorProfileDropdown from "@/components/layout/InstitutionOperatorProfileDropdown";

export default function OperatorReportsPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const instId = user?.institutionId || "AICTE-INST-1001";
  const instName = user?.institutionName || "Delhi Institute of Technology & Management";

  const handleDownloadReport = async (
    type: "ENROLLMENT" | "CAPACITY" | "DISCREPANCY",
    filename: string
  ) => {
    setDownloading(type);
    try {
      const blob = await dashboardApi.exportReport(type);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${instId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setToast({ ok: true, text: `Report ${filename} downloaded successfully.` });
    } catch {
      setToast({ ok: false, text: "Failed to generate analytical report." });
    } finally {
      setDownloading(null);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-xl ring-1 transition animate-in fade-in slide-in-from-bottom-4 ${
            toast.ok
              ? "bg-slate-900 text-white ring-slate-800"
              : "bg-red-600 text-white ring-red-700"
          }`}
        >
          {toast.ok ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-white" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">
              <FileSpreadsheet className="h-3.5 w-3.5 text-violet-300" />
              Reporting Desk
            </span>
            <span className="text-xs text-slate-400">
              {instName} ({instId})
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Institutional Analytics &amp; Compliance Exports
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Generate and export official CSV reports for enrollment audits and quota compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <InstitutionOperatorProfileDropdown />
        </div>
      </header>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Report 1 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Student Enrollment Register</h3>
            <p className="mt-1 text-xs text-slate-500">
              Full breakdown of verified student admissions, APAAR IDs, category quotas, and admission dates.
            </p>
          </div>
          <button
            type="button"
            disabled={downloading === "ENROLLMENT"}
            onClick={() => handleDownloadReport("ENROLLMENT", "student_enrollment_register")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {downloading === "ENROLLMENT" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Export Enrollment CSV</span>
          </button>
        </div>

        {/* Report 2 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <PieChart className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Seat Capacity &amp; Quota Audit</h3>
            <p className="mt-1 text-xs text-slate-500">
              Department-wise approved intake capacity, regular seats filled, vacancies, and supernumerary caps.
            </p>
          </div>
          <button
            type="button"
            disabled={downloading === "CAPACITY"}
            onClick={() => handleDownloadReport("CAPACITY", "seat_capacity_audit")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {downloading === "CAPACITY" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Export Capacity CSV</span>
          </button>
        </div>

        {/* Report 3 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Ingestion Discrepancy Log</h3>
            <p className="mt-1 text-xs text-slate-500">
              Summary of all flagged validation errors, APAAR format violations, and duplicate admissions.
            </p>
          </div>
          <button
            type="button"
            disabled={downloading === "DISCREPANCY"}
            onClick={() => handleDownloadReport("DISCREPANCY", "ingestion_discrepancies")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {downloading === "DISCREPANCY" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Export Discrepancies CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}

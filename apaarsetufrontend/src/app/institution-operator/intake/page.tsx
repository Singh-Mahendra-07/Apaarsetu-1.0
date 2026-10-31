"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  PieChart,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi, apiClient } from "@/lib/api";
import { InstitutionDashboardDTO, ProgramCapacityDTO } from "@/types/api";
import InstitutionOperatorProfileDropdown from "@/components/layout/InstitutionOperatorProfileDropdown";

const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

export default function OperatorIntakeManagementPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [dashData, setDashData] = useState<InstitutionDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const cachedProfile = mounted ? apiClient.getUserProfile() : null;
  const instId = user?.institutionId || cachedProfile?.institutionId || "AICTE-INST-1001";
  const instName =
    user?.institutionName ||
    cachedProfile?.institutionName ||
    "Delhi Institute of Technology & Management";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getInstitution("2026-27");
      setDashData(res);
    } catch {
      // Handle gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  const capacities: ProgramCapacityDTO[] = dashData?.programCapacities || [];
  const totalApproved = dashData?.kpi?.totalApprovedIntake ?? 180;
  const totalRegular = dashData?.kpi?.totalRegularApproved ?? 180;
  const totalSuper = dashData?.kpi?.totalSupernumeraryApproved ?? 21;
  const totalFilled = dashData?.kpi?.totalUploaded ?? 17;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">
              <PieChart className="h-3.5 w-3.5 text-violet-300" />
              Intake Quota Desk
            </span>
            <span className="text-xs text-slate-400">
              {instName} ({instId})
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Sanctioned Seat Capacity &amp; Quota Monitoring
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Monitor real-time regular and supernumerary seat utilization against AICTE sanctioned caps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-violet-300" : ""}`} />
            <span>Sync</span>
          </button>
          <InstitutionOperatorProfileDropdown />
        </div>
      </header>

      {/* Quota Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Sanctioned Intake
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalApproved} Seats
          </p>
          <p className="mt-1 text-xs text-slate-500">Across all approved programs</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Regular Quota
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalRegular} Seats
          </p>
          <p className="mt-1 text-xs text-slate-500">State / Central entrance merit</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Supernumerary Quota
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-indigo-600">
            +{totalSuper} Seats
          </p>
          <p className="mt-1 text-xs text-slate-500">EWS, TFW, NRI, PMSSS</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Enrolled / Filled
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
            {totalFilled} / {totalApproved}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {totalApproved - totalFilled} seats currently vacant
          </p>
        </div>
      </div>

      {/* Program-wise Quota Breakdown */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-800">
            Departmental Seat Allocation &amp; Fill Status
          </h2>
          <Link
            href="/institution-operator/bulk"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Upload Enrollment Batch →
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs text-slate-500">Loading seat capacities...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {capacities.map((p) => {
              const fillPct = pct(p.regularFilled, p.regularApproved);
              const isFull = p.regularFilled >= p.regularApproved;
              const vacancies = Math.max(0, p.regularApproved - p.regularFilled);

              return (
                <div key={p.programCode} className="p-6 transition hover:bg-slate-50/50">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600">{p.programCode}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <h3 className="font-semibold text-slate-900">{p.programName}</h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Sanctioned Regular Capacity: {p.regularApproved} Seats • Enrolled:{" "}
                        <span className="font-semibold text-slate-800">{p.regularFilled}</span> •
                        Vacant: <span className="font-semibold text-emerald-600">{vacancies}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-48 text-right">
                        <span className="text-xs font-bold text-slate-700">
                          {fillPct}% Utilized
                        </span>
                        <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isFull
                                ? "bg-red-500"
                                : fillPct > 80
                                  ? "bg-amber-500"
                                  : "bg-indigo-600"
                              }`}
                            style={{ width: `${Math.min(100, fillPct)}%` }}
                          />
                        </div>
                      </div>

                      {isFull && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-200">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Cap Reached
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Supernumerary Sub-caps */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-500">Supernumerary Quotas:</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                      TFW: {p.supernumeraryQuota?.tfw ?? 0} seats
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                      EWS: {p.supernumeraryQuota?.ews ?? 0} seats
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                      NRI / FN: {(p.supernumeraryQuota?.nri ?? 0) + (p.supernumeraryQuota?.ociFn ?? 0)} seats
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                      PMSSS: {p.supernumeraryQuota?.pmsss ?? 0} seats
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

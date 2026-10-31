
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Download,
  GraduationCap,
  Landmark,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Mail,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient, dashboardApi } from "@/lib/api";

/* ----------------------------- Types ----------------------------- */

type InstitutionRow = {
  id: string;
  name: string;
  aicteId: string;
  state: string;
  reported: number;
  validated: number;
};

type CapacityViolation = {
  institution: string;
  state: string;
  program: string;
  enrolled: number;
  capacity: number;
  checks: string[];
};

type Anomaly = {
  type: string;
  apaarMasked: string;
  message: string;
};

type NationalDashboardDTO = {
  participatingInstitutions: number;
  totalStudentsReported: number;
  validatedApaarRecords: number;
  overCapacityCount: number;
  duplicateFlagCount: number;
  academicYear: string;
  institutions: InstitutionRow[];
  capacityViolations: CapacityViolation[];
  anomalies: Anomaly[];
};

/* ----------------------------- Empty dashboard state ----------------------------- */

const EMPTY_DASHBOARD: NationalDashboardDTO = {
  participatingInstitutions: 0,
  totalStudentsReported: 0,
  validatedApaarRecords: 0,
  overCapacityCount: 0,
  duplicateFlagCount: 0,
  academicYear: "2026-27",
  institutions: [],
  capacityViolations: [],
  anomalies: [],
};

/* ----------------------------- Helpers ----------------------------- */

const discrepancy = (r: InstitutionRow) =>
  r.reported === 0
    ? 0
    : ((r.reported - r.validated) / r.reported) * 100;

const discrepancyBadge = (pct: number) =>
  pct >= 50 && pct < 55
    ? {
      label: "High Review Needed",
      cls: "bg-red-100 text-red-700",
    }
    : pct >= 55
      ? {
        label: "High Review",
        cls: "bg-slate-200 text-slate-700",
      }
      : {
        label: "Within limits",
        cls: "bg-emerald-100 text-emerald-700",
      };

/* ----------------------------- Dashboard Page ----------------------------- */

export default function Page() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [data, setData] =
    useState<NationalDashboardDTO>(EMPTY_DASHBOARD);

  const [stateFilter, setStateFilter] = useState("All States");
  const [loading, setLoading] = useState(true);
  const [apiUp, setApiUp] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  /* ----------------------------- Load dashboard ----------------------------- */

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await apiClient.get<NationalDashboardDTO>("/dashboard/national");
      if (res) {
        setData(res);
        setApiUp(true);
      }
    } catch {
      try {
        const healthRes = await fetch("/api/v1/health", { cache: "no-store" });
        setApiUp(healthRes.ok);
      } catch {
        setApiUp(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = async (format: string) => {
    setExportOpen(false);
    try {
      const blob = await dashboardApi.exportReport('ENROLLMENT');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `national-enrollment-report-${data.academicYear || '2026-27'}.${format.toLowerCase().includes('excel') ? 'csv' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  /* ----------------------------- Filters ----------------------------- */

  const states = useMemo(
    () => [
      "All States",
      ...Array.from(
        new Set(data.institutions.map((institution) => institution.state))
      ),
    ],
    [data.institutions]
  );

  const rows = useMemo(
    () =>
      stateFilter === "All States"
        ? data.institutions
        : data.institutions.filter(
          (institution) => institution.state === stateFilter
        ),
    [data.institutions, stateFilter]
  );

  const cleanRate = data.totalStudentsReported
    ? (
      (data.validatedApaarRecords /
        data.totalStudentsReported) *
      100
    ).toFixed(1)
    : "0.0";

  /* ----------------------------- Page UI ----------------------------- */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ----------------------------- Top bar ----------------------------- */}

      <header className="relative z-30 flex items-center justify-between gap-4 bg-[#12294d] px-6 py-3 text-white">
        {/* Left: Branding */}

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-[#12294d]">
            AICTE
          </div>

          <div className="leading-tight">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              System Administration /
            </p>
            <p className="text-base font-semibold">
              Central Control Center
            </p>
          </div>
        </div>

        {/* Center: API status */}

        <div
          className={`hidden items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium lg:flex ${apiUp ? "bg-emerald-900/50" : "bg-red-900/50"
            }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${apiUp
              ? "bg-green-400 shadow-[0_0_8px_#4ade80]"
              : "bg-red-400"
              }`}
          />

          {apiUp
            ? "National Gateway Operational"
            : "National Gateway Offline"}
        </div>

        {/* Right: Clickable admin profile */}

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((open) => !open);
              setExportOpen(false);
            }}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {mounted && user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.fullName || "AICTE Admin"}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-400/80 shadow-sm"
              />
            ) : mounted && user?.fullName ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-[#12294d] font-bold text-sm shadow-sm">
                {user.fullName.slice(0, 2).toUpperCase()}
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white font-bold text-sm shadow-sm animate-pulse">
                <UserRound className="h-5 w-5" />
              </div>
            )}

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold truncate max-w-[160px]">
                {mounted && user?.fullName ? (
                  user.fullName
                ) : (
                  <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-white/20" />
                )}
              </p>
              <p className="text-xs text-slate-300 truncate max-w-[160px]">
                {mounted && user?.role ? (
                  user.role.replace("ROLE_", "").replace("_", " ")
                ) : (
                  <span className="inline-block h-3 w-20 animate-pulse rounded bg-white/20" />
                )}
              </p>
            </div>

            <ChevronDown
              className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* Admin dropdown */}

          {profileOpen && (
            <>
              {/* Click outside to close */}

              <button
                type="button"
                aria-label="Close profile menu"
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 top-full z-50 mt-3 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
                {/* Profile header */}

                <div className="bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    {mounted && user?.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.fullName || "AICTE Admin"}
                        className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-indigo-600/30 shadow-md"
                      />
                    ) : mounted && user?.fullName ? (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#12294d] text-white font-bold text-base shadow-md">
                        {user.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 font-bold text-base shadow-md animate-pulse">
                        <UserRound className="h-6 w-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">
                        {mounted && user?.fullName ? (
                          user.fullName
                        ) : (
                          <span className="inline-block h-4 w-28 animate-pulse rounded bg-slate-200" />
                        )}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {mounted && user?.role ? (
                          user.role.replace("ROLE_", "").replace("_", " ")
                        ) : (
                          <span className="inline-block h-3 w-20 animate-pulse rounded bg-slate-200" />
                        )}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {mounted && user?.status ? user.status : "ACTIVE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin details */}

                <div className="space-y-4 p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        Email address
                      </p>
                      <p className="break-all text-sm font-medium">
                        {mounted && user?.email ? (
                          user.email
                        ) : (
                          <span className="inline-block h-4 w-32 animate-pulse rounded bg-slate-200" />
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        Role
                      </p>
                      <p className="text-sm font-medium">
                        {mounted && user?.role ? (
                          user.role.replace("ROLE_", "")
                        ) : (
                          <span className="inline-block h-4 w-24 animate-pulse rounded bg-slate-200" />
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        User ID
                      </p>
                      <p className="text-sm font-medium font-mono text-xs">
                        {mounted && user?.id ? (
                          user.id
                        ) : (
                          <span className="inline-block h-4 w-24 animate-pulse rounded bg-slate-200" />
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile actions */}

                <div className="border-t border-slate-200 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/aicte-admin/system-setting");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-slate-100"
                  >
                    <Settings className="h-4 w-4 text-slate-500" />
                    Profile Settings
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setProfileOpen(false);
                      try {
                        await logout();
                      } finally {
                        router.push("/login");
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ----------------------------- Main content ----------------------------- */}

      <main className="mx-auto max-w-7xl px-6 pb-10 pt-4">

        {/* Heading */}

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              AICTE National APAAR Dashboard
            </h1>

            <p className="mt-1 text-slate-600">
              Real-time synchronization across technical institutions,
              capacity caps, and identity verification
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""
                  }`}
              />
              Refresh
            </button>

            {/* Export reports */}

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setExportOpen((open) => !open);
                  setProfileOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export Reports
                <ChevronDown className="h-4 w-4" />
              </button>

              {exportOpen && (
                <ul className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
                  {["CSV", "Excel (.xlsx)", "PDF"].map((format) => (
                    <li key={format}>
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-slate-50"
                        onClick={() => handleExport(format)}
                      >
                        Export as {format}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ----------------------------- Stat cards ----------------------------- */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Landmark className="h-6 w-6 text-blue-700" />}
            iconBg="bg-blue-100"
            title="Participating Institutions"
            value={
              loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-200" />
              ) : (
                data.participatingInstitutions
              )
            }
            note="(Active registered colleges)"
            footer={
              <span className="mt-1 inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                MongoDB Connected
              </span>
            }
          />

          <StatCard
            icon={<GraduationCap className="h-6 w-6 text-blue-700" />}
            iconBg="bg-blue-100"
            title="Total Students Reported"
            value={
              loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-200" />
              ) : (
                data.totalStudentsReported
              )
            }
            note="(National enrollment volume)"
          />

          <StatCard
            icon={<ShieldCheck className="h-6 w-6 text-blue-700" />}
            iconBg="bg-blue-100"
            title="Validated APAAR Records"
            value={
              loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-200" />
              ) : (
                data.validatedApaarRecords
              )
            }
            footer={
              <p className="text-xs font-medium text-green-600">
                {cleanRate}% clean validation rate
              </p>
            }
          />

          <StatCard
            icon={<AlertTriangle className="h-6 w-6 text-amber-600" />}
            iconBg="bg-amber-100"
            title="Duplicate & Capacity Alerts"
            value={
              loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-200" />
              ) : (
                data.overCapacityCount + data.duplicateFlagCount
              )
            }
            note={`(${data.overCapacityCount} over-capacity, ${data.duplicateFlagCount} duplicate flags)`}
          />
        </section>

        {/* ----------------------------- Table and side panel ----------------------------- */}

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.9fr_1fr]">
          {/* Institution table */}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-200 px-5 py-4 text-sm font-semibold uppercase tracking-wide">
              State &amp; Institutional Discrepancy League
            </h2>

            <div className="p-5">
              <label className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                Filter by State:

                <select
                  value={stateFilter}
                  onChange={(event) =>
                    setStateFilter(event.target.value)
                  }
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                >
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 font-semibold text-slate-800">
                    <tr>
                      <th className="px-4 py-3">Institution Name</th>
                      <th className="px-4 py-3">AICTE ID</th>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3">Reported</th>
                      <th className="px-4 py-3">Validated</th>
                      <th className="px-4 py-3">Discrepancy %</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            <span>Loading national data...</span>
                          </div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          No institutions reported for {stateFilter}.
                        </td>
                      </tr>
                    ) : (
                      rows.map((institution) => {
                        const pct = discrepancy(institution);
                        const badge = discrepancyBadge(pct);

                        return (
                          <tr
                            key={institution.id}
                            className="border-t border-slate-200"
                          >
                            <td className="max-w-[130px] px-4 py-3">
                              {institution.name}
                            </td>

                            <td className="max-w-[90px] break-words px-4 py-3">
                              {institution.aicteId}
                            </td>

                            <td className="px-4 py-3">
                              {institution.state}
                            </td>

                            <td className="px-4 py-3">
                              {institution.reported}
                            </td>

                            <td className="px-4 py-3">
                              {institution.validated}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${badge.cls}`}
                              >
                                {pct.toFixed(1)}% {badge.label}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <Link
                                href="/aicte-admin/institution-management"
                                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                              >
                                Inspect College
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Violations and anomalies */}

          <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">
              Violations &amp; Anomalies
            </h2>

            {loading ? (
              <div className="space-y-3">
                <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : data.capacityViolations.length === 0 &&
              data.anomalies.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No violations or anomalies right now.
              </p>
            ) : (
              <>
                {data.capacityViolations.map((violation, index) => {
                  const over =
                    violation.enrolled - violation.capacity;

                  const pct = Math.min(
                    100,
                    (violation.enrolled / violation.capacity) * 100
                  );

                  return (
                    <div
                      key={index}
                      className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3"
                    >
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Program Capacity Violations ({data.academicYear})
                      </p>

                      <p className="mt-3 text-sm">
                        <span className="font-semibold">
                          {violation.institution}
                        </span>{" "}
                        | {violation.state}
                      </p>

                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span>{violation.program}</span>

                        {over > 0 && (
                          <span className="whitespace-nowrap font-bold text-red-600">
                            +{over} Violation
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-amber-200">
                          <div
                            className="h-1.5 rounded-full bg-blue-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <span className="text-xs text-slate-600">
                          {violation.enrolled}/{violation.capacity}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-700">
                        Supernumerary Check: {violation.checks.join(", ")}
                      </p>
                    </div>
                  );
                })}

                {data.anomalies.map((anomaly, index) => (
                  <div
                    key={index}
                    className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3"
                  >
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase text-red-800">
                      <span className="h-3 w-3 rounded-full bg-red-500" />
                      System Anomalies &amp; Duplicate Enrollments
                    </p>

                    <span className="mt-2 inline-block rounded border border-red-300 bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                      {anomaly.type}
                    </span>

                    <p className="mt-2 text-sm">
                      Student APAAR: {anomaly.apaarMasked} —{" "}
                      {anomaly.message}
                    </p>

                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          router.push("/aicte-admin/submission-monitoring")
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium hover:bg-slate-50"
                      >
                        Review &amp; Resolve Flag
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}

/* ----------------------------- Reusable Stat Card ----------------------------- */

function StatCard({
  icon,
  iconBg,
  title,
  value,
  note,
  footer,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: React.ReactNode;
  note?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[15px] font-medium text-slate-800">
            {title}
          </p>

          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-900">
              {value}
            </span>

            {note && title === "Participating Institutions" && (
              <span className="text-xs text-slate-600">{note}</span>
            )}
          </p>

          {note && title !== "Participating Institutions" && (
            <p className="text-xs text-slate-600">{note}</p>
          )}

          {footer}
        </div>
      </div>
    </div>
  );
}

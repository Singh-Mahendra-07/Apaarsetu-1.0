"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Download, RefreshCw, Search, ShieldCheck } from "lucide-react";
import OfficerProfileDropdown from "@/components/layout/OfficerProfileDropdown";

/* -------------------------------- Types -------------------------------- */

type Submission = "ON_TIME" | "LATE" | "NOT_UPLOADED";
type IntakeStatus = "COMPLIANT" | "OVER" | "UNKNOWN";

type Row = {
  id: string; // "AICTE-INST-1003"
  name: string;
  affiliation: string;
  submission: Submission;
  daysLate?: number;
  validationRatio: number; // 0-100
  intakeStatus: IntakeStatus;
  overBy?: number;
  pendingDisputes: number;
  overdueDisputes?: number;
  tier: 1 | 2 | 3;
  defects?: string;
};

type Summary = {
  cleanRatio: number;
  onTime: number;
  totalColleges: number;
  intakeBreaches: number;
  activeNotices: number;
};

/* ------------------------------ Sample data ------------------------------ */
// Used only if the API can't be reached.

const SAMPLE_ROWS: Row[] = [
  { id: "AICTE-INST-1003", name: "Northern Institute of Tech", affiliation: "Punjab Tech Univ", submission: "LATE", daysLate: 3, validationRatio: 74.2, intakeStatus: "OVER", overBy: 15, pendingDisputes: 2, overdueDisputes: 2, tier: 3, defects: "Overdue batch, 26% invalid records, +15 excess in MBA" },
  { id: "AICTE-INST-1001", name: "Delhi Inst of Tech & Mgmt", affiliation: "Delhi Tech Univ", submission: "ON_TIME", validationRatio: 96.8, intakeStatus: "OVER", overBy: 16, pendingDisputes: 0, tier: 2, defects: "CSE-UG-101 exceeded regular intake ceiling" },
  { id: "AICTE-INST-1002", name: "Apex College of Engineering", affiliation: "Autonomous", submission: "ON_TIME", validationRatio: 99.2, intakeStatus: "COMPLIANT", pendingDisputes: 0, tier: 1, defects: "Fully compliant across all 4 sanctioned programs" },
  { id: "AICTE-INST-2002", name: "Bangalore Premier Business", affiliation: "Bangalore Univ", submission: "NOT_UPLOADED", validationRatio: 0, intakeStatus: "UNKNOWN", pendingDisputes: 0, tier: 3, defects: "Zero student records submitted for 2026-2027" },
];

const SAMPLE_SUMMARY: Summary = { cleanRatio: 92.4, onTime: 14, totalColleges: 17, intakeBreaches: 3, activeNotices: 4 };

const TIER_META = {
  1: { label: "TIER 1", sub: "(Compliant)", dot: "bg-emerald-500" },
  2: { label: "TIER 2", sub: "(At Risk)", dot: "bg-amber-400" },
  3: { label: "TIER 3", sub: "(Deficient)", dot: "bg-red-500" },
} as const;

const NOTICE_PAGE = "/aicte-officer/compliance/notice";

const ratioColor = (r: number) => (r >= 90 ? "bg-emerald-500" : r >= 60 ? "bg-amber-400" : "bg-red-500");

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token =
    localStorage.getItem("apaarsetu_access_token") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const EMPTY_COMPLIANCE_SUMMARY: Summary = {
  cleanRatio: 0,
  onTime: 0,
  totalColleges: 0,
  intakeBreaches: 0,
  activeNotices: 0,
};

/* --------------------------------- Page --------------------------------- */

export default function ComplianceMonitorPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_COMPLIANCE_SUMMARY);
  const [apiUp, setApiUp] = useState(true);
  const [loading, setLoading] = useState(true);

  const [year, setYear] = useState("2026-2027");
  const [tierF, setTierF] = useState("ALL");
  const [defectF, setDefectF] = useState("ALL");
  const [query, setQuery] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => setApiUp(r.ok))
      .catch(() => setApiUp(false));

    try {
      const res = await fetch(`/api/v1/officer/compliance?year=${year}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as { rows: Row[]; summary: Summary };
        setRows(json.rows);
        setSummary(json.summary);
        setApiUp(true);
      } else if (res.status === 401 || res.status === 403) {
        setApiUp(true);
      }
    } catch {
      // network failure
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (tierF === "WARN" && r.tier === 1) return false;
      if (["1", "2", "3"].includes(tierF) && r.tier !== Number(tierF)) return false;
      if (defectF === "LATE" && r.submission === "ON_TIME") return false;
      if (defectF === "LOW_VALIDATION" && r.validationRatio >= 90) return false;
      if (defectF === "OVER_INTAKE" && r.intakeStatus !== "OVER") return false;
      if (defectF === "DISPUTES" && !r.overdueDisputes) return false;
      return !q || [r.id, r.name, r.affiliation].some((v) => v.toLowerCase().includes(q));
    });
  }, [rows, tierF, defectF, query]);

  const commend = async (r: Row) => {
    try {
      const res = await fetch(`/api/v1/officer/institutions/${r.id}/commendation`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setToast(`Commendation recorded for ${r.name}.`);
    } catch {
      setToast(`Could not record the commendation for ${r.name}. Try again.`);
    }
  };

  const exportCsv = () => {
    const head = ["AICTE ID", "College", "Affiliation", "Submission", "Validation %", "Intake Status", "Pending Disputes", "Tier"];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = filtered.map((r) =>
      [r.id, r.name, r.affiliation, r.submission, r.validationRatio, r.intakeStatus + (r.overBy ? ` (+${r.overBy})` : ""), r.pendingDisputes, `Tier ${r.tier}`].map(esc).join(",")
    );
    const blob = new Blob([[head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onTimePct = summary.totalColleges ? ((summary.onTime / summary.totalColleges) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" onClick={() => setMenuOpen(false)}>
      {/* ------------------------------ Top bar ------------------------------ */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold">
            APAAR Portal <span className="font-normal text-slate-400">-</span> AICTE Nodal Officer Console
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
              apiUp ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${apiUp ? "bg-emerald-500" : "bg-red-500"}`} />
            {apiUp ? "API Connected (Port 8081)" : "API Unreachable (Port 8081)"}
          </span>
          <OfficerProfileDropdown />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-6">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Regulatory Compliance Division <span className="text-slate-400">-</span> North Zone
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Compliance Monitoring Dashboard</h1>

        {/* ----------------------------- Stat cards ----------------------------- */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat title="Zonal Compliance">
            <p className="text-2xl font-bold text-emerald-600">{summary.cleanRatio}% Clean Ratio</p>
            <p className="text-sm text-slate-600">Across North Zone</p>
          </Stat>
          <Stat title="On-Time Submissions">
            <p className="text-2xl font-bold">
              {summary.onTime} / {summary.totalColleges} Colleges
            </p>
            <p className="text-sm text-slate-600">({onTimePct}% On-Time Rate)</p>
          </Stat>
          <Stat title="Intake Breaches">
            <p className="text-2xl font-bold text-red-600">{summary.intakeBreaches} Institutions</p>
            <p className="text-sm text-slate-600">(Exceeding Sanctioned)</p>
          </Stat>
          <Stat title="Show-Cause Notices">
            <p className="text-2xl font-bold">{summary.activeNotices} Active Notices</p>
            <p className="text-sm text-slate-600">(Awaiting Response)</p>
          </Stat>
        </section>

        {/* ------------------------------ Table card ------------------------------ */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <FilterSelect label="Year" value={year} onChange={setYear} options={[["2026-2027", "2026-2027"], ["2025-2026", "2025-2026"], ["2024-2025", "2024-2025"]]} />
            <FilterSelect label="Tier" value={tierF} onChange={setTierF} options={[["ALL", "All Tiers"], ["WARN", "Defaulters & Warnings Only"], ["3", "Tier 3 (Deficient)"], ["2", "Tier 2 (At Risk)"], ["1", "Tier 1 (Compliant)"]]} />
            <FilterSelect label="Defect" value={defectF} onChange={setDefectF} options={[["ALL", "All Issues"], ["LATE", "Late / Missing Submission"], ["LOW_VALIDATION", "Low Validation Ratio"], ["OVER_INTAKE", "Over Intake"], ["DISPUTES", "Overdue Disputes"]]} />
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search AICTE ID, College Name, City..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <button onClick={load} disabled={loading} aria-label="Refresh" className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-medium hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export Compliance CSV
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-700">
                <tr>
                  <th className="px-4 py-3">AICTE ID</th>
                  <th className="px-4 py-3">College Name</th>
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Validation Ratio</th>
                  <th className="px-4 py-3">Intake Status</th>
                  <th className="px-4 py-3">Disputes</th>
                  <th className="px-4 py-3">Grade / Tier</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      No colleges match these filters. Clear the search or change a filter.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const tier = TIER_META[r.tier];
                  return (
                    <tr key={r.id} className="border-t border-slate-200 align-top">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-indigo-700">#{r.id}</td>
                      <td className="min-w-[260px] px-4 py-3">
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-xs text-slate-600">Affiliated to {r.affiliation}</p>
                        {r.defects && (
                          <p className={`mt-1 text-xs ${r.tier === 1 ? "text-emerald-700" : "text-slate-600"}`}>
                            *{r.tier === 1 ? "" : "Defects: "}
                            {r.defects}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {r.submission === "ON_TIME" && <Dot cls="bg-emerald-500" text="On-Time" textCls="text-emerald-700" />}
                        {r.submission === "LATE" && <Dot cls="bg-red-500" text={`${r.daysLate} Days Late`} textCls="text-red-600" />}
                        {r.submission === "NOT_UPLOADED" && <Dot cls="bg-red-500" text="NOT UPLOADED" textCls="text-red-600" />}
                      </td>
                      <td className="min-w-[170px] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-slate-200" role="img" aria-label={`${r.validationRatio}% validated`}>
                            <div className={`h-2 rounded-full ${ratioColor(r.validationRatio)}`} style={{ width: `${r.validationRatio}%` }} />
                          </div>
                          <span className="font-medium">{r.validationRatio.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {r.intakeStatus === "OVER" && <Dot cls="bg-red-500" text={`OVER (+${r.overBy})`} textCls="text-red-600" />}
                        {r.intakeStatus === "COMPLIANT" && <Dot cls="bg-emerald-500" text="COMPLIANT" textCls="text-emerald-700" />}
                        {r.intakeStatus === "UNKNOWN" && <Dot cls="bg-slate-400" text="UNKNOWN" textCls="text-slate-600" />}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {r.overdueDisputes ? (
                          <span className="font-medium text-red-600">{r.overdueDisputes} Overdue</span>
                        ) : (
                          <span>{r.pendingDisputes} Pending</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="flex items-start gap-2">
                          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${tier.dot}`} />
                          <span className="leading-tight">
                            <b>{tier.label}</b>
                            <br />
                            <span className="text-xs text-slate-600">{tier.sub}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.submission === "NOT_UPLOADED" ? (
                          <NoticeLink id={r.id} label="Summon Head" extra="&type=SHOW_CAUSE_10_1_K" />
                        ) : r.tier === 1 ? (
                          <button
                            onClick={() => commend(r)}
                            className="whitespace-nowrap rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Commend
                          </button>
                        ) : (
                          <NoticeLink id={r.id} label="Issue Notice" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Small pieces ------------------------------ */

// Opens the notice page in a new tab, with the institution already selected.
function NoticeLink({ id, label, extra = "" }: { id: string; label: string; extra?: string }) {
  return (
    <Link
      href={`${NOTICE_PAGE}?institutionId=${encodeURIComponent(id)}${extra}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block whitespace-nowrap rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
    >
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </Link>
  );
}

function Dot({ cls, text, textCls }: { cls: string; text: string; textCls: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${textCls}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
      {text}
    </span>
  );
}

function Stat({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex items-center gap-2 font-medium text-slate-700">
      {label}:
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none rounded-md border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 text-sm font-normal outline-none focus:border-indigo-500"
        >
          {options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </span>
    </label>
  );
}

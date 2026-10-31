"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  Download,
  Eye,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import OfficerProfileDropdown from "@/components/layout/OfficerProfileDropdown";

/* -------------------------------- Types -------------------------------- */

type ConflictType =
  | "DUAL_ENROLLMENT"
  | "CAPACITY_EXCEEDED"
  | "INVALID_MIGRATION";

type Severity = "CRIT" | "HIGH" | "MED" | "LOW";
type FlagStatus = "PENDING" | "RESOLVED" | "HEARING";

type Flag = {
  id: string;
  type: ConflictType;
  apaarId: string;
  candidateName?: string;
  primaryCollege: string;
  conflictingCollege: string | null;
  evidence: { name: string; url: string } | null;
  severity: Severity;
  status: FlagStatus;
};

type CapacityRow = {
  institution: string;
  program: string;
  intake: number;
  current: number;
};

type Summary = {
  unresolvedFlags: number;
  regionalColleges: number;
  cleanValidated: number;
  totalRecords: number;
};

type CardRow = {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "bad";
};

type RecordCard = {
  heading: string;
  tone: "red" | "blue" | "neutral";
  rows: CardRow[];
};

type FlagDetail = {
  candidate?: { name: string; apaarId: string; dob: string };
  capacity?: {
    institution: string;
    program: string;
    sanctioned: number;
    enrolled: number;
  };
  records?: RecordCard[];
  warning?: string;
  evidence: { name: string; rejection?: boolean }[];
};

/* ------------------------------ Sample data ------------------------------ */



const SAMPLE_DETAILS: Record<string, FlagDetail> = {
  "FLG-101": {
    candidate: {
      name: "Aarav Sharma",
      apaarId: "9845-1234-5678",
      dob: "12-Apr-2004",
    },
    records: [
      {
        heading: "College A (Reported 15-Jun-2026)",
        tone: "red",
        rows: [
          { label: "Institution", value: "Delhi Inst of Tech" },
          { label: "Program", value: "B.Tech Computer Science (CS)" },
          { label: "Category", value: "Regular General" },
          {
            label: "Status",
            value: "ADMITTED_ACTIVE",
            tone: "ok",
          },
        ],
      },
      {
        heading: "College B (Reported 20-Jul-2026)",
        tone: "blue",
        rows: [
          {
            label: "Institution",
            value: "Bengaluru Premier Acad",
          },
          { label: "Program", value: "B.Tech Information Tech" },
          { label: "Category", value: "Management Quota" },
          {
            label: "Status",
            value: "ADMITTED_ACTIVE",
            tone: "ok",
          },
        ],
      },
    ],
    evidence: [
      { name: "Transfer_Certificate_No_4402.pdf" },
      { name: "AICTE_Migration_NOC.pdf" },
    ],
  },

  "FLG-102": {
    capacity: {
      institution: "Mumbai Tech University",
      program: "MCA (Computer Applications)",
      sanctioned: 120,
      enrolled: 135,
    },
    evidence: [
      { name: "AICTE_Approved_Intake_2026.pdf" },
      { name: "Admission_Register_Log_Oct26.pdf" },
    ],
  },

  "FLG-103": {
    candidate: {
      name: "Rahul Deshmukh",
      apaarId: "9870-4567-8901",
      dob: "05-Nov-2005",
    },
    warning: "Potential invalid or unilateral migration",
    records: [
      {
        heading: "Former College (Origin)",
        tone: "neutral",
        rows: [
          { label: "Institution", value: "Punjab Engg Coll" },
          { label: "Program", value: "B.Tech Mechanical Engg" },
          {
            label: "Status",
            value: "ENROLLED (No exit/withdrawal recorded)",
            tone: "ok",
          },
          {
            label: "Migration Request",
            value: "DENIED / PENDING BY INSTITUTION",
            tone: "bad",
          },
        ],
      },
      {
        heading: "New College (Destination)",
        tone: "red",
        rows: [
          { label: "Institution", value: "Chandigarh Tech Univ" },
          { label: "Program", value: "B.Tech Mechanical Engg" },
          { label: "Admission Date", value: "02-Aug-2026" },
          {
            label: "Status",
            value: "ADMITTED_PROVISIONAL (Awaiting Migration Certificate)",
            tone: "warn",
          },
        ],
      },
    ],
    evidence: [
      { name: "Student_Transfer_Application.pdf" },
      {
        name: "PEC_NOC_Rejection_Letter.pdf",
        rejection: true,
      },
      { name: "CTU_Provisional_Offer.pdf" },
    ],
  },
};

/* ------------------------- Per-type dialog settings ------------------------- */

type Decision = {
  value: string;
  desc: string;
  outcome: FlagStatus;
};

const CONFIG: Record<
  ConflictType,
  { title: string; confirm: string; decisions: Decision[] }
> = {
  DUAL_ENROLLMENT: {
    title: "Adjudicate Enrollment Conflict",
    confirm: "Confirm & Sign Decision",
    decisions: [
      {
        value: "APPROVE_TRANSFER",
        desc: "Validate College B admission; set College A to TRANSFERRED_OUT.",
        outcome: "RESOLVED",
      },
      {
        value: "REJECT_DUPLICATE",
        desc: "Invalidate College B admission as fraudulent/unauthorized.",
        outcome: "RESOLVED",
      },
      {
        value: "DISMISS_FLAG",
        desc: "False positive; student completed previous degree.",
        outcome: "RESOLVED",
      },
      {
        value: "ALLOW_EXCEPTION",
        desc: "Grant regulatory waiver for dual-degree program.",
        outcome: "RESOLVED",
      },
    ],
  },

  CAPACITY_EXCEEDED: {
    title: "Adjudicate Capacity Breach",
    confirm: "Confirm & Apply Regulatory Action",
    decisions: [
      {
        value: "REGULARIZE_OVER_INTAKE",
        desc: "Apply supernumerary/special quota to absorb the extra students.",
        outcome: "RESOLVED",
      },
      {
        value: "REJECT_EXCESS_ADMISSIONS",
        desc: "Force removal and invalidate the over-quota records.",
        outcome: "RESOLVED",
      },
      {
        value: "IMPOSE_PENALTY_FREEZE",
        desc: "Set college status to SUSPENDED, invoke penalty, and alert central admin.",
        outcome: "RESOLVED",
      },
      {
        value: "DISMISS_ALERT_CALIBRATE",
        desc: "False positive; calibration mismatch.",
        outcome: "RESOLVED",
      },
    ],
  },

  INVALID_MIGRATION: {
    title: "Adjudicate Migration Conflict",
    confirm: "Confirm & Sign Decision",
    decisions: [
      {
        value: "APPROVE_MIGRATION",
        desc: "Force-approve the transfer; set the origin college to TRANSFERRED_OUT and activate the new college (overrides origin denial).",
        outcome: "RESOLVED",
      },
      {
        value: "REJECT_MIGRATION_REVERT",
        desc: "Invalidate the provisional record at the new college; student remains enrolled at the origin college.",
        outcome: "RESOLVED",
      },
      {
        value: "FLAG_FOR_HEARING",
        desc: "Lock both enrollment statuses and schedule a regulatory mediation hearing.",
        outcome: "HEARING",
      },
    ],
  },
};

const SEVERITY_BADGE: Record<Severity, string> = {
  CRIT: "bg-red-50 text-red-700 border-red-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  MED: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};

const SEVERITY_FILTER: Record<string, Severity> = {
  Critical: "CRIT",
  High: "HIGH",
  Medium: "MED",
  Low: "LOW",
};

const apiId = (flagId: string) => flagId.replace("#", "");

async function readError(res: Response) {
  try {
    const j = await res.json();
    return (
      (j.message as string) ||
      (j.error as string) ||
      `Request failed (${res.status}).`
    );
  } catch {
    return `Request failed (${res.status}).`;
  }
}

const EMPTY_OFFICER_SUMMARY: Summary = {
  unresolvedFlags: 0,
  regionalColleges: 0,
  cleanValidated: 0,
  totalRecords: 0,
};

export default function OfficerConsolePage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [radar, setRadar] = useState<CapacityRow[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_OFFICER_SUMMARY);
  const [apiUp, setApiUp] = useState(true);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState<"All" | ConflictType>("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | FlagStatus>(
    "PENDING"
  );

  const [adjudicating, setAdjudicating] = useState<Flag | null>(null);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => setApiUp(r.ok))
      .catch(() => setApiUp(false));

    try {
      const res = await fetch("/api/v1/officer/dashboard", {
        cache: "no-store",
      });

      if (res.ok) {
        const json = (await res.json()) as {
          flags: Flag[];
          radar: CapacityRow[];
          summary: Summary;
        };

        setFlags(json.flags);
        setRadar(json.radar);
        setSummary(json.summary);
        setResolvedCount(0);
        setApiUp(true);
      } else if (res.status === 401 || res.status === 403) {
        setApiUp(true);
      }
    } catch {
      // Network connection error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;

    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const unresolved = Math.max(
    0,
    summary.unresolvedFlags - resolvedCount
  );

  const hasCritical = flags.some(
    (f) => f.status === "PENDING" && f.severity === "CRIT"
  );

  const capacityAlerts = radar.filter(
    (r) => r.current > r.intake
  ).length;

  const cleanRate = summary.totalRecords
    ? ((summary.cleanValidated / summary.totalRecords) * 100).toFixed(1)
    : "0.0";

  const rows = useMemo(
    () =>
      flags.filter((f) => {
        if (typeFilter !== "All" && f.type !== typeFilter) return false;

        if (
          severityFilter !== "All" &&
          f.severity !== SEVERITY_FILTER[severityFilter]
        ) {
          return false;
        }

        if (statusFilter !== "All" && f.status !== statusFilter) {
          return false;
        }

        return true;
      }),
    [flags, typeFilter, severityFilter, statusFilter]
  );

  const onAdjudicated = (
    flag: Flag,
    status: FlagStatus,
    severity: Severity
  ) => {
    setFlags((prev) =>
      prev.map((f) =>
        f.id === flag.id ? { ...f, status, severity } : f
      )
    );

    setResolvedCount((c) => c + 1);
    setAdjudicating(null);

    setToast(
      status === "HEARING"
        ? `${flag.id} scheduled for a regulatory hearing.`
        : `${flag.id} adjudicated.`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <h2 className="text-base font-bold sm:text-lg">
            APAAR Portal{" "}
            <span className="font-normal text-slate-400">-</span>{" "}
            AICTE Nodal Officer Console
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${apiUp
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${apiUp ? "bg-emerald-500" : "bg-red-500"
                }`}
            />
            {apiUp
              ? "National Gateway Operational"
              : "National Gateway Offline"}
          </span>

          <OfficerProfileDropdown />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold uppercase tracking-tight sm:text-2xl">
            Regulatory Compliance Division
          </h1>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Queue
          </button>
        </div>

        {/* Stat cards */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat title="Pending Queue">
            {unresolved === 0 ? (
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-sm font-bold text-emerald-800">
                CLEAR
              </span>
            ) : (
              <span
                className={`rounded-md px-2 py-0.5 text-sm font-bold ${hasCritical
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-800"
                  }`}
              >
                {hasCritical ? "CRITICAL" : "PENDING"}
              </span>
            )}

            <p className="mt-2 text-slate-700">
              {unresolved} unresolved flags
            </p>
          </Stat>

          <Stat title="Capacity Alerts">
            <p
              className={`text-3xl font-bold ${capacityAlerts ? "text-red-600" : "text-slate-900"
                }`}
            >
              {capacityAlerts}
            </p>
            <p className="text-slate-700">Over-intake alerts</p>
          </Stat>

          <Stat title="Regional Colleges">
            <p className="text-3xl font-bold">
              {summary.regionalColleges}
            </p>
            <p className="text-slate-700">under jurisdiction</p>
          </Stat>

          <Stat title="Clean Validation">
            <p className="text-3xl font-bold text-emerald-600">
              {cleanRate}%
            </p>
            <p className="text-slate-700">
              {summary.cleanValidated.toLocaleString("en-IN")} /{" "}
              {summary.totalRecords.toLocaleString("en-IN")}{" "}
              <span className="text-emerald-600">ok</span>
            </p>
          </Stat>
        </section>

        {/* Flags table */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-3 text-sm">
            <span className="font-medium text-slate-700">Filter:</span>

            <Select
              label="All Types"
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as typeof typeFilter)}
              options={[
                "All",
                "DUAL_ENROLLMENT",
                "CAPACITY_EXCEEDED",
                "INVALID_MIGRATION",
              ]}
            />

            <Select
              label="All Severities"
              prefix="Severity: "
              value={severityFilter}
              onChange={setSeverityFilter}
              options={["All", "Critical", "High", "Medium", "Low"]}
            />

            <Select
              label="All Statuses"
              prefix="Status: "
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              options={["All", "PENDING", "RESOLVED", "HEARING"]}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 font-semibold">
                <tr>
                  <th className="px-4 py-3">Flag ID</th>
                  <th className="px-4 py-3">Conflict Type</th>
                  <th className="px-4 py-3">Candidate APAAR ID</th>
                  <th className="px-4 py-3">Primary College (Old)</th>
                  <th className="px-4 py-3">Conflicting Col (New)</th>
                  <th className="px-4 py-3">Evidence Attached</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No flags match these filters. The queue may be clear.
                    </td>
                  </tr>
                )}

                {rows.map((f) => (
                  <tr key={f.id} className="border-t border-slate-200">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-indigo-700">
                      {f.id}
                    </td>

                    <td className="px-4 py-3">{f.type}</td>

                    <td className="px-4 py-3">
                      <p className="font-mono text-xs">{f.apaarId}</p>
                      {f.candidateName && (
                        <p className="text-xs text-slate-600">
                          {f.candidateName}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">{f.primaryCollege}</td>

                    <td className="px-4 py-3">
                      {f.conflictingCollege ?? (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    <td className="max-w-[200px] px-4 py-3">
                      {f.evidence ? (
                        <a
                          href={f.evidence.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-start gap-1.5 text-indigo-700 hover:underline"
                        >
                          <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="break-all">
                            {f.evidence.name}
                          </span>
                        </a>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-bold ${SEVERITY_BADGE[f.severity]
                          }`}
                      >
                        [{f.severity}]
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {f.status === "PENDING" ? (
                        <button
                          onClick={() => setAdjudicating(f)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          <Scale className="h-4 w-4" />
                          Adjudicate
                        </button>
                      ) : (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${f.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-50 text-amber-800"
                            }`}
                        >
                          {f.status === "HEARING"
                            ? "IN HEARING"
                            : f.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Capacity radar */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 text-sm font-bold uppercase tracking-wide">
            <Building2 className="h-4 w-4 text-indigo-600" />
            Program Capacity Radar (Over-Quota)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 font-semibold">
                <tr>
                  <th className="px-5 py-3">Institution Name</th>
                  <th className="px-5 py-3">Program</th>
                  <th className="px-5 py-3">Intake</th>
                  <th className="px-5 py-3">Current</th>
                  <th className="px-5 py-3">Over By</th>
                </tr>
              </thead>

              <tbody>
                {radar.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      No programs are over their approved intake.
                    </td>
                  </tr>
                )}

                {radar.map((r, i) => {
                  const over = r.current - r.intake;

                  return (
                    <tr key={i} className="border-t border-slate-200">
                      <td className="px-5 py-3 font-medium">
                        {r.institution}
                      </td>
                      <td className="px-5 py-3">{r.program}</td>
                      <td className="px-5 py-3">{r.intake}</td>

                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          {r.current}
                          {over > 0 && (
                            <AlertTriangle
                              className="h-4 w-4 text-amber-500"
                              aria-label="Over quota"
                            />
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        {over > 0 ? (
                          <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                            +{over}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
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

      {/* Adjudication popup */}
      {adjudicating && (
        <AdjudicateModal
          flag={adjudicating}
          onClose={() => setAdjudicating(null)}
          onDone={onAdjudicated}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Adjudicate modal ----------------------------- */

function AdjudicateModal({
  flag,
  onClose,
  onDone,
}: {
  flag: Flag;
  onClose: () => void;
  onDone: (flag: Flag, status: FlagStatus, severity: Severity) => void;
}) {
  const cfg = CONFIG[flag.type];
  const id = apiId(flag.id);

  const [detail, setDetail] = useState<FlagDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [sampleNote, setSampleNote] = useState(false);
  const [decision, setDecision] = useState(cfg.decisions[0].value);
  const [severity, setSeverity] = useState<Severity>(flag.severity);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/v1/flags/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error(String(res.status));

        const json = (await res.json()) as FlagDetail;

        if (!cancelled) setDetail(json);
      } catch {
        if (!cancelled && SAMPLE_DETAILS[id]) {
          setDetail(SAMPLE_DETAILS[id]);
          setSampleNote(true);
        } else if (!cancelled) {
          setError("Could not load the details for this flag.");
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const close = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("keydown", onKey);

    // Keep the page behind the popup from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [close]);

  const evidenceUrl = (name: string, download = false) => {
    const base = detail?.candidate
      ? `/api/v1/students/${encodeURIComponent(
        detail.candidate.apaarId
      )}/evidence/${encodeURIComponent(name)}`
      : `/api/v1/flags/${id}/evidence/${encodeURIComponent(name)}`;

    return download ? `${base}?download=true` : base;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (remarks.trim().length < 10) {
      setError(
        "Add regulatory remarks of at least 10 characters. They are recorded in the audit log."
      );
      return;
    }

    setBusy(true);
    setError(null);

    try {
      // Update severity if the officer changed it.
      if (severity !== flag.severity) {
        const severityRes = await fetch(
          `/api/v1/flags/${id}/severity`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ severity }),
          }
        );

        if (!severityRes.ok) {
          throw new Error(await readError(severityRes));
        }
      }

      // Submit the formal decision.
      const res = await fetch(`/api/v1/flags/${id}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          remarks: remarks.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error(await readError(res));
      }

      const outcome =
        cfg.decisions.find((d) => d.value === decision)?.outcome ??
        "RESOLVED";

      onDone(flag, outcome, severity);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not record the decision."
      );
    } finally {
      setBusy(false);
    }
  };

  const over = detail?.capacity
    ? detail.capacity.enrolled - detail.capacity.sanctioned
    : 0;

  return (
    /* FIX: viewport-sized overlay with a centered, height-limited modal */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900/60 p-3 sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="adj-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        /* FIX: constrain height and use a vertical flex layout */
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]"
      >
        {/* Header remains visible */}
        <div className="flex shrink-0 items-start justify-between gap-3 bg-indigo-700 px-4 py-4 text-white sm:px-6">
          <div className="min-w-0">
            <h3
              id="adj-title"
              className="flex items-start gap-2 text-base font-bold sm:text-lg"
            >
              <Scale className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                {cfg.title}: Flag {flag.id}
              </span>
            </h3>

            {detail?.capacity && (
              <p className="mt-1 text-sm text-indigo-100">
                Institution: {detail.capacity.institution} | Program:{" "}
                {detail.capacity.program}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={close}
            disabled={busy}
            className="shrink-0 rounded p-1 text-indigo-100 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FIX: only the content area scrolls */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 text-sm sm:px-6 sm:py-5">
          {loadingDetail && (
            <p className="flex items-center gap-2 py-8 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading flag details...
            </p>
          )}

          {sampleNote && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              The API is unreachable, so this dialog is showing sample data.
              Decisions cannot be saved until the API is available.
            </p>
          )}

          {detail && (
            <>
              {/* Candidate details */}
              {detail.candidate && (
                <div className="break-words rounded-lg bg-slate-100 px-4 py-2.5">
                  Candidate: <b>{detail.candidate.name}</b>{" "}
                  <span className="text-slate-400">|</span> APAAR ID:{" "}
                  <span className="font-mono">
                    {detail.candidate.apaarId}
                  </span>{" "}
                  <span className="text-slate-400">|</span> DOB:{" "}
                  {detail.candidate.dob}
                </div>
              )}

              {/* Warning */}
              {detail.warning && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 font-semibold uppercase text-red-700"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Warning: {detail.warning}</span>
                </div>
              )}

              {/* Capacity information */}
              {detail.capacity && (
                <div className="space-y-3">
                  {over > 0 && (
                    <p className="flex items-center gap-2 text-base font-bold text-red-700">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      CRITICAL: +{over} Students Over Approved Intake
                    </p>
                  )}

                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-indigo-50 px-3 py-4 text-center sm:px-4">
                      <div>
                        <p className="text-xs text-slate-600 sm:text-sm">
                          AICTE Sanctioned Intake
                        </p>
                        <p className="text-xl font-bold">
                          {detail.capacity.sanctioned} Seats
                        </p>
                      </div>

                      <span className="px-1 font-semibold text-slate-500 sm:px-4">
                        VS
                      </span>

                      <div>
                        <p className="text-xs text-slate-600 sm:text-sm">
                          Currently Enrolled Count
                        </p>
                        <p
                          className={`text-xl font-bold ${over > 0 ? "text-red-600" : ""
                            }`}
                        >
                          {detail.capacity.enrolled}
                        </p>
                      </div>
                    </div>

                    {over > 0 && (
                      <p className="flex items-center justify-center gap-2 bg-red-50 px-2 py-2 text-center font-semibold uppercase text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {over} excess admissions detected
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Conflicting records */}
              {detail.records && (
                <div>
                  <p className="mb-2 font-bold uppercase text-slate-700">
                    {flag.type === "INVALID_MIGRATION"
                      ? "Migration compare"
                      : "Conflicting records detected"}
                    :
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {detail.records.map((r) => (
                      <RecordCardView key={r.heading} card={r} />
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence */}
              <div>
                <p className="mb-2 font-bold uppercase text-slate-700">
                  {flag.type === "DUAL_ENROLLMENT"
                    ? "Evidence submitted by student / institution"
                    : "Evidence"}
                  :
                </p>

                <ul className="space-y-2">
                  {detail.evidence.map((ev) => (
                    <li
                      key={ev.name}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
                    >
                      <span className="inline-flex min-w-0 items-start gap-1.5">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                        <span className="break-all">{ev.name}</span>
                      </span>

                      <a
                        href={evidenceUrl(ev.name)}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1 hover:underline ${ev.rejection
                          ? "text-red-700"
                          : "text-indigo-700"
                          }`}
                      >
                        {ev.rejection ? (
                          <Ban className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        {ev.rejection
                          ? "View Rejection Document"
                          : "View Document"}
                      </a>

                      <a
                        href={evidenceUrl(ev.name, true)}
                        download
                        className="inline-flex items-center gap-1 text-indigo-700 hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Severity selection */}
              <fieldset className="rounded-lg border border-slate-200 p-3 sm:p-4">
                <legend className="px-1 text-sm font-bold uppercase text-slate-700">
                  Set case severity level (officer designation)
                </legend>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {(
                    [
                      {
                        v: "CRIT",
                        label: "CRITICAL",
                        icon: <CircleAlert className="h-4 w-4" />,
                        on: "border-red-500 bg-red-50 text-red-700",
                        ring: "focus-within:ring-red-300",
                      },
                      {
                        v: "HIGH",
                        label: "HIGH",
                        icon: <AlertTriangle className="h-4 w-4" />,
                        on: "border-amber-500 bg-amber-50 text-amber-800",
                        ring: "focus-within:ring-amber-300",
                      },
                      {
                        v: "MED",
                        label: "MEDIUM",
                        icon: <Info className="h-4 w-4" />,
                        on: "border-sky-500 bg-sky-50 text-sky-800",
                        ring: "focus-within:ring-sky-300",
                      },
                    ] as const
                  ).map((s) => (
                    <label
                      key={s.v}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-semibold focus-within:ring-2 sm:px-4 sm:text-sm ${s.ring
                        } ${severity === s.v
                          ? s.on
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={s.v}
                        checked={severity === s.v}
                        onChange={() => setSeverity(s.v)}
                        className="sr-only"
                      />

                      {s.icon}
                      {s.label}

                      {severity === s.v && (
                        <Check className="h-4 w-4" />
                      )}
                    </label>
                  ))}
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  Manual override by AICTE Officer. Updating this
                  immediately alters worklist routing.
                </p>

                <p className="mt-0.5 break-all font-mono text-[11px] text-slate-400">
                  PUT /api/v1/flags/{id}/severity
                </p>
              </fieldset>

              {/* Formal decision */}
              <fieldset>
                <legend className="mb-2 font-bold uppercase text-slate-700">
                  {flag.type === "DUAL_ENROLLMENT"
                    ? "Formal regulatory decision"
                    : "Decisions"}
                  :
                </legend>

                <div className="space-y-2">
                  {cfg.decisions.map((d) => (
                    <label
                      key={d.value}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 ${decision === d.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-transparent hover:bg-slate-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        value={d.value}
                        checked={decision === d.value}
                        onChange={() => setDecision(d.value)}
                        className="mt-1 shrink-0 accent-indigo-600"
                      />

                      <span className="min-w-0 break-words">
                        <b>{d.value}</b>{" "}
                        <span className="text-slate-500">—</span>{" "}
                        {d.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Remarks */}
              <label className="block">
                <span className="mb-1 block font-bold uppercase text-slate-700">
                  {flag.type === "DUAL_ENROLLMENT"
                    ? "Mandatory regulatory remarks"
                    : "Resolution remarks"}
                  :
                </span>

                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Record what you verified and why you decided this way."
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />

                <span className="break-all font-mono text-[11px] text-slate-400">
                  PUT /api/v1/flags/{id}/resolve
                </span>
              </label>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="break-words rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer remains visible at the bottom */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 sm:px-4"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={busy || !detail || sampleNote || loadingDetail}
            className="inline-flex max-w-[75%] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-none sm:px-5"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Check className="h-4 w-4 shrink-0" />
            )}

            <span>{busy ? "Saving..." : cfg.confirm}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------ Small pieces ------------------------------ */

const CARD_TONE = {
  red: "border-red-300 bg-red-50",
  blue: "border-sky-300 bg-sky-50",
  neutral: "border-slate-300 bg-white",
} as const;

const VALUE_TONE = {
  ok: "font-semibold text-emerald-700",
  warn: "font-semibold text-amber-700",
  bad: "font-semibold text-red-700",
} as const;

function RecordCardView({ card }: { card: RecordCard }) {
  return (
    <div className={`rounded-xl border p-4 ${CARD_TONE[card.tone]}`}>
      <p className="mb-2 font-bold">{card.heading}</p>

      <dl className="space-y-1">
        {card.rows.map((r) => (
          <div
            key={r.label}
            className="grid grid-cols-[100px_minmax(0,1fr)] gap-2 sm:grid-cols-[110px_minmax(0,1fr)]"
          >
            <dt className="font-medium text-slate-700">
              {r.label}:
            </dt>

            <dd className={`break-words ${r.tone ? VALUE_TONE[r.tone] : ""}`}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Stat({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">
        {title}
      </p>
      {children}
    </div>
  );
}

function Select({
  label,
  prefix = "",
  value,
  onChange,
  options,
}: {
  label: string;
  prefix?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-sm outline-none focus:border-indigo-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "All" ? label : `${prefix}${o}`}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}
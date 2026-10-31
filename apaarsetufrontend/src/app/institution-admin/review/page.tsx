"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { batchApi, dashboardApi, apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BatchResponseDTO } from "@/types/api";
import InstitutionAdminProfileDropdown from "@/components/layout/InstitutionAdminProfileDropdown";

const ROUTES = {
  audit: (id: string) => `/institution-admin/review/audit?batchId=${encodeURIComponent(id)}`,
};

const PAGE_SIZE = 10;

/* ============ TYPES ============ */
type Batch = {
  batchId: string;
  fileName: string;
  program: string;
  programCode: string;
  academicYear: string;
  submittedBy: string;
  submittedAt: string;
  records: number;
  validated: number;
  errors: number;
  hash: string;
  status: "PENDING" | "APPROVED" | "RETURNED";
  validationStatus: "VALIDATED" | "PARTIALLY_VALID";
};

/* ============ HELPERS ============ */
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/* ============ SMALL COMPONENTS (Exact from frontend02) ============ */
function Badge({
  tone,
  children,
}: {
  tone: "emerald" | "amber" | "red" | "slate" | "indigo";
  children: ReactNode;
}) {
  const c = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-600",
    indigo: "bg-indigo-50 text-indigo-700",
  }[tone];
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>
      {children}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  wide,
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl ${wide ? "max-w-3xl" : "max-w-md"
          }`}
      >
        <div className="flex items-center justify-between bg-indigo-600 px-5 py-3 text-white">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded p-1 hover:bg-indigo-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

const th = "whitespace-nowrap bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold text-slate-500";
const td = "border-t border-slate-200 px-3 py-3 text-sm text-slate-700";
const btnOutline =
  "rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

/* ============ PAGE COMPONENT ============ */
export default function ReviewApprovalsPage() {
  const { user } = useAuth();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [tab, setTab] = useState<"PENDING" | "APPROVED" | "RETURNED" | "ALL">("PENDING");
  const [q, setQ] = useState("");
  const [program, setProgram] = useState("ALL");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [institutionLabel, setInstitutionLabel] = useState("AICTE-INST: Institution Console");

  const [quick, setQuick] = useState<Batch | null>(null);
  const [rejecting, setRejecting] = useState<Batch | null>(null);
  const [reason, setReason] = useState("");
  const [reasonErr, setReasonErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr("");
    try {
      const [dashRes, batchRes] = await Promise.allSettled([
        dashboardApi.getInstitution(),
        batchApi.getBatches({ page: 0, size: 100 }),
      ]);

      const profile = apiClient.getUserProfile();
      const userInstId = user?.institutionId || profile?.institutionId || "";
      if (dashRes.status === "fulfilled" && dashRes.value) {
        const id = dashRes.value.institutionId || userInstId || "AICTE-INST";
        const name = dashRes.value.institutionName || profile?.institutionName || "Institution Console";
        setInstitutionLabel(`${id}: ${name}`);
      } else if (profile?.institutionName) {
        setInstitutionLabel(`${userInstId || "AICTE-INST"}: ${profile.institutionName}`);
      }

      if (batchRes.status === "fulfilled" && batchRes.value?.content) {
        const mapped: Batch[] = batchRes.value.content.map((b: BatchResponseDTO) => {
          const total = b.summary?.totalRows ?? 0;
          const valid = b.summary?.validatedCount ?? 0;
          const errors =
            (b.summary?.invalidFormatCount || 0) +
            (b.summary?.duplicateCount || 0) +
            (b.summary?.anomalyFlagCount || 0) +
            (b.summary?.capacityOverflowCount || 0);

          let st: Batch["status"] = "PENDING";
          if (b.status === "APPROVED") st = "APPROVED";
          else if (b.status === "REJECTED" || b.status === "FAILED") st = "RETURNED";

          const valSt: Batch["validationStatus"] =
            errors === 0 && valid > 0 ? "VALIDATED" : "PARTIALLY_VALID";

          // Extract program code / discipline from backend field, filename or fallback
          const fileBase = b.fileName?.replace(/\.[^/.]+$/, "") || "Admissions Batch";
          const progCodeMatch = b.fileName?.match(/([a-zA-Z]{2,4}[-_]?[a-zA-Z]{0,4}[-_]?\d{2,4})/);
          const progCode = b.programCode || (progCodeMatch ? progCodeMatch[0].toUpperCase() : "ADM-PROG");

          let progTitle = b.programCode || "Admissions Intake";
          const pUpper = (b.programCode || fileBase).toUpperCase();
          if (pUpper.includes("CSE") || pUpper.includes("CS")) {
            progTitle = "B.Tech Computer Science";
          } else if (pUpper.includes("ECE")) {
            progTitle = "B.Tech Electronics & Comm";
          } else if (pUpper.includes("MECH")) {
            progTitle = "B.Tech Mechanical Engg";
          } else if (pUpper.includes("CIVIL")) {
            progTitle = "B.Tech Civil Engg";
          } else if (pUpper.includes("MBA")) {
            progTitle = "Master of Business Admin";
          } else if (pUpper.includes("MCA")) {
            progTitle = "Master of Computer Apps";
          } else {
            progTitle = fileBase.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          }

          const uploadDate = b.createdAt
            ? new Date(b.createdAt).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
            : "Recent";

          return {
            batchId: b.id,
            fileName: b.fileName,
            program: progTitle,
            programCode: progCode,
            academicYear: b.academicYear || "2026-27",
            submittedBy: b.institutionId ? `operator@${b.institutionId.toLowerCase()}.edu` : "operator@institution.edu",
            submittedAt: uploadDate,
            records: total,
            validated: valid,
            errors: errors,
            hash: b.id ? `sha256:${b.id.slice(0, 8)}...` : "sha256:7b2a9f...",
            status: st,
            validationStatus: valSt,
          };
        });

        setBatches(mapped);
        setApiOk(true);
      } else if (batchRes.status === "rejected") {
        throw batchRes.reason;
      }
    } catch (e) {
      setBatches([]);
      setApiOk(false);
      setLoadErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh list when tab returns to visibility (not continuous window focus)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setPage(1);
  }, [tab, q, program]);


  const count = (s: Batch["status"]) => batches.filter((b) => b.status === s).length;
  const pending = batches.filter((b) => b.status === "PENDING");
  const programs = useMemo(() => Array.from(new Set(batches.map((b) => b.program))), [batches]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return batches.filter(
      (b) =>
        (tab === "ALL" || b.status === tab) &&
        (program === "ALL" || b.program === program) &&
        (!s ||
          b.batchId.toLowerCase().includes(s) ||
          b.fileName.toLowerCase().includes(s) ||
          b.submittedBy.toLowerCase().includes(s))
    );
  }, [batches, tab, q, program]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function approve(b: Batch) {
    setBusy(b.batchId);
    try {
      await batchApi.approveBatch(b.batchId);
      setToast({ ok: true, text: `${b.batchId} signed and committed.` });
      setQuick(null);
      await load();
    } catch (e) {
      setToast({ ok: false, text: `Could not approve ${b.batchId}: ${errMsg(e)}` });
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!rejecting) return;
    if (reason.trim().length < 5) {
      setReasonErr("Enter notes of at least 5 characters for the operator.");
      return;
    }
    setBusy(rejecting.batchId);
    try {
      await batchApi.rejectBatch(rejecting.batchId, reason.trim());
      setToast({ ok: true, text: `${rejecting.batchId} returned to operator.` });
      setRejecting(null);
      setReason("");
      await load();
    } catch (e) {
      setReasonErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  const startReject = (b: Batch) => {
    setRejecting(b);
    setReason("");
    setReasonErr("");
  };

  const tabs: [typeof tab, string][] = [
    ["PENDING", `Pending approval (${count("PENDING")})`],
    ["APPROVED", `Approved and committed (${count("APPROVED")})`],
    ["RETURNED", `Returned for revision (${count("RETURNED")})`],
    ["ALL", "All batches"],
  ];

  const tabTitle = {
    PENDING: "Batches awaiting administrative approval",
    APPROVED: "Approved and committed batches",
    RETURNED: "Batches returned for revision",
    ALL: "All batches",
  }[tab];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Header (Exact from frontend02) */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
          <span className="text-sm font-bold">APAAR Portal</span>
          <span className="text-sm text-slate-500">| Institution Administration Console</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            role="status"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${apiOk ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
          >
            <span className={`h-2 w-2 rounded-full ${apiOk ? "bg-emerald-500" : "bg-red-500"}`} />
            {apiOk ? "National Gateway Operational" : "National Gateway Offline"}
          </span>
          <span className="hidden text-xs font-medium text-slate-600 md:inline">
            [{institutionLabel}]
          </span>
          <button
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <InstitutionAdminProfileDropdown />
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto max-w-7xl space-y-5 p-6">
        <div>
          <p className="text-xs font-semibold text-indigo-700">Institution Administration</p>
          <h1 className="text-xl font-bold">Review and Approvals</h1>
          <p className="text-sm text-slate-500">
            Two-tier quality assurance and administrative sign-off gatekeeper
          </p>
        </div>

        {!apiOk && !loading && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
          >
            <span>Could not load batches ({loadErr}). Backend service or session unavailable on Port 8081.</span>
            <button onClick={load} className="font-semibold underline hover:text-red-900">
              Retry
            </button>
          </div>
        )}

        {pending.length > 0 && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <b>Action required:</b> {plural(pending.length, "student batch")} uploaded by operators{" "}
              {pending.length === 1 ? "requires" : "require"} your official administrative sign-off.
            </span>
          </div>
        )}

        {/* 4 Stat KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Awaiting approval"
            value={plural(pending.length, "batch").replace("batchs", "batches")}
            sub="Action required"
          />
          <Stat
            label="Pending students"
            value={`${pending.reduce((s, b) => s + b.records, 0)} students`}
            sub="Ready to commit"
          />
          <Stat
            label="Committed batches"
            value={String(count("APPROVED"))}
            sub="Active 2026-27"
          />
          <Stat
            label="Rejected / returned"
            value={plural(count("RETURNED"), "batch").replace("batchs", "batches")}
            sub="Returned to operator"
          />
        </div>

        {/* Batch Table Container */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div
            role="tablist"
            aria-label="Batch status"
            className="flex flex-wrap gap-1 border-b border-slate-200 px-4 pt-3"
          >
            {tabs.map(([k, l]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${tab === k
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 p-4">
            <div className="relative min-w-[240px] flex-1">
              <label htmlFor="bsearch" className="sr-only">
                Search batch ID, file name, operator email
              </label>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="bsearch"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search batch ID, file name, operator email..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <label htmlFor="prog" className="text-sm text-slate-600">
              Program:
            </label>
            <select
              id="prog"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="ALL">All programs</option>
              {programs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              onClick={load}
              disabled={loading}
              className={`${btnOutline} inline-flex items-center gap-2`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}{" "}
              Refresh
            </button>
          </div>

          <p className="px-4 pb-2 text-xs font-semibold text-slate-600">{tabTitle}</p>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 border-t border-slate-200 py-16 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                Loading batches...
              </div>
            ) : rows.length === 0 ? (
              <p className="border-t border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                {batches.length === 0
                  ? "No batches have been uploaded yet."
                  : "No batches match your search or filters."}
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {[
                      "Row #",
                      "Batch ID and file name",
                      "Program and year",
                      "Submitted by / uploaded",
                      "Records",
                      "Validation breakdown",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th key={h} className={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b, i) => (
                    <tr key={b.batchId} className="hover:bg-slate-50/50">
                      <td className={td}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className={td}>
                        <div className="font-semibold text-slate-900">{b.batchId}</div>
                        <div className="break-all text-xs text-slate-500">{b.fileName}</div>
                      </td>
                      <td className={td}>
                        {b.program} ({b.programCode}) - Academic Year {b.academicYear}
                      </td>
                      <td className={td}>
                        <div>{b.submittedBy}</div>
                        <div className="text-xs text-slate-500">{b.submittedAt}</div>
                      </td>
                      <td className={td}>{b.records}</td>
                      <td className={`${td} min-w-[210px]`}>
                        <div className="text-xs">
                          <b className="text-emerald-700">
                            {b.validated} valid ({pct(b.validated, b.records).toFixed(1)}%)
                          </b>
                          {b.errors > 0 && (
                            <span className="font-semibold text-red-600">
                              {" "}
                              | {b.errors} errors
                            </span>
                          )}
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-red-100">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${pct(b.validated, b.records)}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge tone={b.validationStatus === "VALIDATED" ? "emerald" : "amber"}>
                            {b.validationStatus}
                          </Badge>
                        </div>
                        <div className="mt-1.5 inline-block rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                          Hash: {b.hash}
                        </div>
                      </td>
                      <td className={td}>
                        <Badge
                          tone={
                            b.status === "PENDING"
                              ? "amber"
                              : b.status === "APPROVED"
                                ? "emerald"
                                : "red"
                          }
                        >
                          {b.status === "PENDING"
                            ? "Pending"
                            : b.status === "APPROVED"
                              ? "Committed"
                              : "Returned"}
                        </Badge>
                      </td>
                      <td className={td}>
                        <div className="flex flex-col gap-1.5">
                          <a
                            href={ROUTES.audit(b.batchId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Inspect and audit ${b.batchId} (opens in a new tab)`}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-600 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                          >
                            Inspect and audit <ExternalLink className="h-3 w-3" />
                          </a>
                          {b.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => setQuick(b)}
                                aria-label={`Quick approve ${b.batchId}`}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                              >
                                Quick approve
                              </button>
                              <button
                                onClick={() => startReject(b)}
                                aria-label={`Reject ${b.batchId}`}
                                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span>
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} -{" "}
              {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
              {plural(filtered.length, "batch").replace("batchs", "batches")}
              {tab === "PENDING" ? " awaiting sign-off" : ""}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
                className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quick Approve Modal */}
      {quick && (
        <Modal title={`Quick approve ${quick.batchId}`} onClose={() => setQuick(null)}>
          <div className="p-5 text-sm text-slate-700">
            <p>
              This commits <b>{quick.validated}</b> validated records without opening the audit view.
            </p>
            {quick.errors > 0 && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-800">
                {plural(quick.errors, "record")} with errors will not be committed. Use Inspect and audit
                to review them first.
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setQuick(null)} className={btnOutline}>
                Cancel
              </button>
              <button
                onClick={() => approve(quick)}
                disabled={busy === quick.batchId}
                className={btnPrimary}
              >
                {busy === quick.batchId && <Loader2 className="h-4 w-4 animate-spin" />} Approve batch
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject and Return Modal */}
      {rejecting && (
        <Modal
          title={`Reject and return ${rejecting.batchId}`}
          onClose={() => setRejecting(null)}
        >
          <div className="p-5">
            <label htmlFor="notes" className="block text-sm font-medium text-slate-800">
              Notes for the operator
            </label>
            <textarea
              id="notes"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonErr("");
              }}
              placeholder="Explain the defects, capacity anomalies, or required remediation..."
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            {reasonErr && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {reasonErr}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRejecting(null)} className={btnOutline}>
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={busy === rejecting.batchId}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy === rejecting.batchId && <Loader2 className="h-4 w-4 animate-spin" />} Return batch
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-[60] max-w-sm rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.ok ? "bg-emerald-600" : "bg-red-600"
            }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

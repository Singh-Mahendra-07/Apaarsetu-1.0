"use client";

import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { batchApi, dashboardApi, studentApi, apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BatchDetailDTO, BatchErrorDTO, StudentListDTO } from "@/types/api";
import InstitutionAdminProfileDropdown from "@/components/layout/InstitutionAdminProfileDropdown";

const ROUTES = { approvals: "/institution-admin/review" };
const PAGE_SIZE = 10;

/* ============ TYPES ============ */
type Audit = {
  batchId: string;
  fileName: string;
  program: string;
  programCode: string;
  records: number;
  validated: number;
  errors: number;
  status: "PENDING" | "APPROVED" | "RETURNED";
  approvedLimit: number;
  currentlyEnrolled: number;
};

type ErrRow = {
  row: number;
  studentName: string;
  apaarId: string;
  field: string;
  ruleCode: string;
  remedy: string;
};

type RecRow = {
  row: number;
  studentName: string;
  apaarId: string;
  seatCategory: string;
};

/* ============ HELPERS ============ */
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);

function Badge({
  tone,
  children,
}: {
  tone: "emerald" | "amber" | "red";
  children: ReactNode;
}) {
  const c = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  }[tone];
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>
      {children}
    </span>
  );
}

const th = "whitespace-nowrap bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold text-slate-500";
const td = "border-t border-slate-200 px-3 py-3 text-sm text-slate-700";

/* ============ AUDIT PAGE COMPONENT ============ */
function AuditPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batchId") || "";

  const [audit, setAudit] = useState<Audit | null>(null);
  const [errors, setErrors] = useState<ErrRow[]>([]);
  const [records, setRecords] = useState<RecRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState(true);
  const [fatal, setFatal] = useState("");
  const [sectionErr, setSectionErr] = useState<{ errors?: string; records?: string }>({});

  const [tab, setTab] = useState<"valid" | "errors">("errors");
  const [page, setPage] = useState(1);
  const [certified, setCertified] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonErr, setReasonErr] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [actionErr, setActionErr] = useState("");
  const [done, setDone] = useState<"approved" | "returned" | null>(null);

  const [institutionLabel, setInstitutionLabel] = useState("AICTE-INST: Institution Console");

  const load = useCallback(async () => {
    if (!batchId) {
      setLoading(false);
      setFatal("No batch was specified in the link.");
      return;
    }

    setLoading(true);
    setFatal("");

    try {
      const [dashRes, detailRes, errorsRes, recordsRes, studentsRes] = await Promise.allSettled([
        dashboardApi.getInstitution(),
        batchApi.getBatchById(batchId),
        batchApi.getBatchErrors(batchId),
        batchApi.getBatchRecords(batchId),
        studentApi.getStudents({ size: 100 }),
      ]);

      let approvedCap = 180;
      let currentEnrolled = 0;

      const profile = apiClient.getUserProfile();
      const userInstId = user?.institutionId || profile?.institutionId || "";
      if (dashRes.status === "fulfilled" && dashRes.value) {
        const id = dashRes.value.institutionId || userInstId || "AICTE-INST";
        const name = dashRes.value.institutionName || profile?.institutionName || "Institution Console";
        setInstitutionLabel(`${id}: ${name}`);

        if (dashRes.value.kpi) {
          approvedCap = dashRes.value.kpi.totalApprovedIntake || 180;
          currentEnrolled = dashRes.value.kpi.totalUploaded || 0;
        }
      }

      if (detailRes.status === "fulfilled" && detailRes.value) {
        const d: BatchDetailDTO = detailRes.value;
        const total = d.summary?.totalRows ?? 0;
        const valid = d.summary?.validatedCount ?? 0;
        const errsCount =
          (d.summary?.invalidFormatCount || 0) +
          (d.summary?.duplicateCount || 0) +
          (d.summary?.anomalyFlagCount || 0) +
          (d.summary?.capacityOverflowCount || 0);

        let st: Audit["status"] = "PENDING";
        if (d.status === "APPROVED") st = "APPROVED";
        else if (d.status === "REJECTED" || d.status === "FAILED") st = "RETURNED";

        const pCode = d.programCode || "CSE-UG-101";

        // Program capacity lookup if available in dashboard
        if (dashRes.status === "fulfilled" && dashRes.value?.programCapacities) {
          const matchedProg = dashRes.value.programCapacities.find(
            (cp) => cp.programCode?.toUpperCase() === pCode.toUpperCase()
          );
          if (matchedProg) {
            approvedCap = matchedProg.regularApproved || approvedCap;
            currentEnrolled = matchedProg.regularFilled || currentEnrolled;
          }
        }

        const auditData: Audit = {
          batchId: d.id || batchId,
          fileName: d.fileName || "admissions_batch.csv",
          program: pCode.toUpperCase().includes("CS")
            ? "B.Tech Computer Science"
            : pCode.toUpperCase().includes("MBA")
              ? "Master of Business Admin"
              : "Undergraduate Degree",
          programCode: pCode,
          records: total,
          validated: valid,
          errors: errsCount,
          status: st,
          approvedLimit: approvedCap,
          currentlyEnrolled: currentEnrolled,
        };

        setAudit(auditData);
        setTab(errsCount > 0 ? "errors" : "valid");

        // Map Errors
        let errList: ErrRow[] = [];
        if (errorsRes.status === "fulfilled" && Array.isArray(errorsRes.value)) {
          errList = errorsRes.value.map((e: BatchErrorDTO, idx: number) => ({
            row: e.rowNumber || idx + 1,
            studentName: e.studentName || "Student Record",
            apaarId: e.apaarId || "INVALID_FORMAT",
            field: e.fieldName || "Data Field",
            ruleCode: e.ruleCode || "VALIDATION_RULE",
            remedy: e.errorMessage || "Remediation required",
          }));
        } else if (d.errors && Array.isArray(d.errors)) {
          errList = d.errors.map((e: BatchErrorDTO, idx: number) => ({
            row: e.rowNumber || idx + 1,
            studentName: e.studentName || "Student Record",
            apaarId: e.apaarId || "INVALID_FORMAT",
            field: e.fieldName || "Data Field",
            ruleCode: e.ruleCode || "VALIDATION_RULE",
            remedy: e.errorMessage || "Remediation required",
          }));
        }
        setErrors(errList);

        // Map Valid Records (Prefer actual batch-linked records from DB, fallback to students)
        let recList: RecRow[] = [];
        if (recordsRes.status === "fulfilled" && Array.isArray(recordsRes.value) && recordsRes.value.length > 0) {
          recList = recordsRes.value.map((r, idx) => ({
            row: r.row || idx + 1,
            studentName: r.studentName,
            apaarId: r.apaarId,
            seatCategory: r.seatCategory || "Regular",
          }));
        } else if (studentsRes.status === "fulfilled" && studentsRes.value?.content) {
          recList = studentsRes.value.content.slice(0, valid || 10).map((s: StudentListDTO, idx: number) => ({
            row: idx + 1,
            studentName: s.fullName || `Student Candidate ${idx + 1}`,
            apaarId: s.apaarId || `APAAR-${1000 + idx}`,
            seatCategory: s.seatCategory || "Regular",
          }));
        }
        setRecords(recList);
        setSectionErr({});
        setApiOk(true);
      } else {
        throw new Error(detailRes.status === "rejected" ? errMsg(detailRes.reason) : "Batch not found.");
      }
    } catch (e) {
      setApiOk(false);
      setFatal(`Could not load batch ${batchId}: ${errMsg(e)}`);
      setAudit(null);
      setErrors([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [batchId, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve() {
    if (!audit) return;
    setBusy("approve");
    setActionErr("");
    try {
      await batchApi.approveBatch(audit.batchId);
      setAudit({ ...audit, status: "APPROVED" });
      setDone("approved");
    } catch (e) {
      setActionErr(`Could not sign and commit: ${errMsg(e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!audit) return;
    if (reason.trim().length < 5) {
      setReasonErr("Enter notes of at least 5 characters for the operator.");
      return;
    }
    setBusy("reject");
    setActionErr("");
    try {
      await batchApi.rejectBatch(audit.batchId, reason.trim());
      setAudit({ ...audit, status: "RETURNED" });
      setDone("returned");
      setRejectOpen(false);
    } catch (e) {
      setReasonErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  const projected = audit ? audit.currentlyEnrolled + audit.validated : 0;
  const fill = audit ? pct(projected, audit.approvedLimit) : 0;
  const over = audit ? projected > audit.approvedLimit : false;
  const locked = !audit || audit.status !== "PENDING";
  const pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const shown = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
          </button>
          <InstitutionAdminProfileDropdown />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl space-y-5 p-6">
        <Link
          href={ROUTES.approvals}
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Review and Approvals
        </Link>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading audit data...
          </div>
        ) : fatal || !audit ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
          >
            {fatal || "Batch not found."}{" "}
            <button onClick={load} className="font-semibold underline hover:text-red-900">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Hero Gradient Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-indigo-800 to-blue-700 p-6 text-white shadow-sm">
              <p className="text-xs font-semibold text-indigo-200">
                Pre-commit batch audit and statutory sign-off
              </p>
              <h1 className="mt-1 text-2xl font-bold">{audit.batchId}</h1>
              <p className="mt-2 text-sm text-indigo-100">
                File: <b>{audit.fileName}</b> | Program:{" "}
                <b>
                  {audit.program} ({audit.programCode})
                </b>{" "}
                | Records: <b>{audit.records}</b>
              </p>
            </div>

            {!apiOk && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
              >
                The API is unreachable on Port 8081. Signing and rejecting will fail until backend is available.
              </div>
            )}

            {done && (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />{" "}
                  {done === "approved"
                    ? `${audit.batchId} was officially signed and student provisional records committed.`
                    : `${audit.batchId} was returned to the operator for remediation.`}
                </span>
                <span className="flex gap-3">
                  <Link href={ROUTES.approvals} className="font-semibold underline">
                    Back to approvals
                  </Link>
                  <button onClick={() => window.close()} className="font-semibold underline">
                    Close this tab
                  </button>
                </span>
              </div>
            )}

            {!done && locked && (
              <div
                role="status"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
              >
                This batch is no longer pending review, so it can only be viewed in read-only mode.
              </div>
            )}

            {/* Intake Capacity Simulation Card */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Intake capacity simulation</h2>
              <p className="mt-2 text-sm text-slate-700">
                Program approved limit: <b>{audit.approvedLimit} regular seats</b> | Currently enrolled:{" "}
                <b>{audit.currentlyEnrolled}</b> | This batch validated: <b>{audit.validated}</b>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-slate-600">Projected post-approval fill:</span>
                <div
                  className="h-2.5 w-48 overflow-hidden rounded-full bg-slate-200"
                  role="progressbar"
                  aria-valuenow={Math.round(fill)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Projected fill"
                >
                  <div
                    className={`h-full ${over ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(fill, 100)}%` }}
                  />
                </div>
                <b>
                  {projected} / {audit.approvedLimit} ({fill.toFixed(1)}%)
                </b>
                <Badge tone={over ? "red" : "emerald"}>
                  {over ? "Exceeds AICTE ceiling" : "Within AICTE ceiling"}
                </Badge>
              </div>
            </section>

            {/* Audit Records & Errors Table Section */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div
                role="tablist"
                aria-label="Audit sections"
                className="flex flex-wrap gap-1 border-b border-slate-200 px-4 pt-3"
              >
                {(
                  [
                    ["valid", <CheckCircle2 key="a" className="h-4 w-4" />, `Validated records (${audit.validated})`],
                    ["errors", <AlertTriangle key="b" className="h-4 w-4" />, `Row-level errors and defects (${audit.errors})`],
                  ] as const
                ).map(([k, icon, label]) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={tab === k}
                    onClick={() => setTab(k)}
                    className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold ${tab === k
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {tab === "errors" ? (
                <div role="tabpanel" className="overflow-x-auto">
                  {sectionErr.errors ? (
                    <p role="alert" className="p-5 text-sm text-red-600">
                      Could not load errors: {sectionErr.errors}
                    </p>
                  ) : errors.length === 0 ? (
                    <p className="p-10 text-center text-sm text-slate-500">
                      No row-level errors in this batch. 100% compliant with AICTE validation rules.
                    </p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr>
                          {[
                            "Row #",
                            "Student name",
                            "APAAR ID",
                            "Field",
                            "Error rule code",
                            "Remedy / action",
                          ].map((h) => (
                            <th key={h} className={th}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {errors.map((r) => (
                          <tr key={`${r.row}-${r.field}`} className="hover:bg-slate-50/50">
                            <td className={`${td} whitespace-nowrap`}>Row {r.row}</td>
                            <td className={td}>{r.studentName}</td>
                            <td
                              className={`${td} font-mono text-xs ${/\d/.test(r.apaarId) ? "" : "font-semibold text-red-600"
                                }`}
                            >
                              {r.apaarId}
                            </td>
                            <td className={`${td} font-mono text-xs`}>{r.field}</td>
                            <td className={`${td} font-mono text-xs`}>{r.ruleCode}</td>
                            <td className={td}>{r.remedy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div role="tabpanel">
                  {sectionErr.records ? (
                    <p role="alert" className="p-5 text-sm text-red-600">
                      Could not load records: {sectionErr.records}
                    </p>
                  ) : records.length === 0 ? (
                    <p className="p-10 text-center text-sm text-slate-500">
                      No validated records to show.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              {["Row #", "Student name", "APAAR ID", "Seat category"].map((h) => (
                                <th key={h} className={th}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {shown.map((r) => (
                              <tr key={r.row} className="hover:bg-slate-50/50">
                                <td className={td}>Row {r.row}</td>
                                <td className={td}>{r.studentName}</td>
                                <td className={`${td} font-mono text-xs text-indigo-700`}>
                                  {r.apaarId}
                                </td>
                                <td className={td}>{r.seatCategory}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                        <span>
                          Page {page} of {pages}
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
                    </>
                  )}
                </div>
              )}
            </section>

            {/* Statutory Certification & Sign-Off Section */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Statutory certification</h2>
              <label className="mt-2 flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={certified}
                  disabled={locked}
                  onChange={(e) => setCertified(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded accent-indigo-600"
                />
                <span>
                  I, as authorized Head of Institution, certify under penalty of perjury that these student
                  admission records are genuine, verified against original certificates, and strictly within
                  AICTE sanctioned seat ceilings.
                </span>
              </label>

              {rejectOpen && !locked && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50/50 p-4">
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
                    placeholder="Provide specific instructions on formatting, duplicate rows, or seat quotas..."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  {reasonErr && (
                    <p role="alert" className="mt-1 text-xs text-red-600">
                      {reasonErr}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => setRejectOpen(false)}
                      className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={reject}
                      disabled={busy !== null}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {busy === "reject" && <Loader2 className="h-4 w-4 animate-spin" />} Confirm return
                      to operator
                    </button>
                  </div>
                </div>
              )}

              {actionErr && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {actionErr}
                </p>
              )}

              <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  onClick={() => {
                    setRejectOpen(true);
                    setReasonErr("");
                  }}
                  disabled={locked || busy !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Reject and return to operator with notes
                </button>
                <button
                  onClick={approve}
                  disabled={locked || busy !== null || !certified || over}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === "approve" && <Loader2 className="h-4 w-4 animate-spin" />} Officially sign
                  and commit batch
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center gap-2 bg-slate-50 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading batch audit desk...
        </div>
      }
    >
      <AuditPage />
    </Suspense>
  );
}

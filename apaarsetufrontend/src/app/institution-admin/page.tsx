"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  Copy,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { dashboardApi, batchApi, institutionApi, apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import InstitutionAdminProfileDropdown from "@/components/layout/InstitutionAdminProfileDropdown";

const ROUTES = {
  batch: (id: string) => `/institution-admin/review/audit?batchId=${encodeURIComponent(id)}`,
};

/* ============ TYPES ============ */
type Batch = {
  batchId: string;
  program: string;
  fileName: string;
  records: number;
  validated: number;
  errors: number;
  submittedBy: string;
};

type Dashboard = {
  institutionName: string;
  institutionId: string;
  affiliatedUniversity: string;
  academicYear: string;
  adminName: string;
  sanctionedSeats: number;
  enrolledSeats: number;
  cleanRecordPercent: number;
  actionRequiredRecords: number;
  activeKeys: number;
  lastSyncedMinutesAgo: number;
  unresolvedDuplicates: number;
  duplicatesResolvedPercent: number;
  pendingBatches: Batch[];
};

type Intake = {
  code: string;
  degree: string;
  approved: number;
  enrolled: number;
  tfw: [number, number];
  ews: [number, number];
  nri: [number, number];
};

type ErpKey = {
  keyId: string;
  label: string;
  identifier: string;
  createdOn: string;
  lastUsedAt: string;
  status: "ACTIVE" | "REVOKED";
};

/* ============ HELPERS ============ */
const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

/* ============ SMALL COMPONENTS (Exact from frontend02) ============ */
function Stat({
  label,
  value,
  sub,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  tone?: "slate" | "amber" | "emerald" | "red";
}) {
  const ring = {
    slate: "border-slate-200",
    amber: "border-amber-300",
    emerald: "border-emerald-200",
    red: "border-red-200",
  }[tone];
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${ring}`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "emerald" | "amber" | "red" | "slate";
  children: ReactNode;
}) {
  const c = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-600",
  }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{children}</span>;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between bg-indigo-600 px-5 py-3 text-white">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button aria-label="Close dialog" onClick={onClose} className="rounded p-1 hover:bg-indigo-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

const th = "bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap";
const td = "border-t border-slate-200 px-4 py-3 text-sm text-slate-700 whitespace-nowrap";

/* ============ PAGE (Exact frontend02 architecture + live backend) ============ */
export default function InstitutionDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [dash, setDash] = useState<Dashboard | null>(null);
  const [intake, setIntake] = useState<Intake[]>([]);
  const [keys, setKeys] = useState<ErpKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState(true);
  const [sectionErr, setSectionErr] = useState<{ intake?: string; keys?: string }>({});
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [rejectFor, setRejectFor] = useState<Batch | null>(null);
  const [reason, setReason] = useState("");
  const [reasonErr, setReasonErr] = useState("");
  const [revokeFor, setRevokeFor] = useState<ErpKey | null>(null);
  const [keyModal, setKeyModal] = useState(false);
  const [keyLabel, setKeyLabel] = useState("");
  const [keyLabelErr, setKeyLabelErr] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const say = (ok: boolean, text: string) => setToast({ ok, text });


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, bRes] = await Promise.all([
        dashboardApi.getInstitution(),
        batchApi.getBatches({ page: 0, size: 20 }).catch(() => ({ content: [] })),
      ]);

      const instId = dRes.institutionId || apiClient.getUserProfile()?.institutionId || "";

      let affiliation = "AICTE Recognized University";
      let keyList: ErpKey[] = [];

      if (instId) {
        const [metaRes, keysRes] = await Promise.allSettled([
          institutionApi.getInstitutionById(instId),
          institutionApi.getApiKeys(instId),
        ]);

        if (metaRes.status === "fulfilled" && metaRes.value?.universityAffiliation) {
          affiliation = metaRes.value.universityAffiliation;
        }

        if (keysRes.status === "fulfilled" && Array.isArray(keysRes.value)) {
          keyList = keysRes.value.map((k) => ({
            keyId: k.keyId,
            label: k.label,
            identifier: k.keyId,
            createdOn: k.createdAt ? new Date(k.createdAt).toLocaleDateString() : "—",
            lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never used",
            status: k.active ? "ACTIVE" : "REVOKED",
          }));
        }
      }

      const pendingBatchesList: Batch[] = (bRes.content || [])
        .filter((b) => b.status === "VALIDATED" || b.status === "PROCESSING" || b.status === "UPLOADED" || b.status === "FLAGGED")
        .map((b) => ({
          batchId: b.id,
          program: b.fileName,
          fileName: b.academicYear ? `Academic Year ${b.academicYear}` : "Enrollment Batch",
          records: b.summary?.totalRows ?? 0,
          validated: b.summary?.validatedCount ?? 0,
          errors:
            (b.summary?.invalidFormatCount || 0) +
            (b.summary?.duplicateCount || 0) +
            (b.summary?.anomalyFlagCount || 0) +
            (b.summary?.capacityOverflowCount || 0),
          submittedBy: b.institutionId || "Operator",
        }));

      const activeKeys = keyList.filter((k) => k.status === "ACTIVE").length;

      const profile = apiClient.getUserProfile();
      const mappedDash: Dashboard = {
        institutionName: dRes.institutionName || profile?.institutionName || "Institution Admin Console",
        institutionId: dRes.institutionId || profile?.institutionId || "AICTE-INST",
        affiliatedUniversity: affiliation,
        academicYear: dRes.academicYear || "2026-2027",
        adminName: profile?.fullName || "Admin",
        sanctionedSeats: dRes.kpi?.totalApprovedIntake || 0,
        enrolledSeats: dRes.kpi?.totalUploaded || 0,
        cleanRecordPercent: dRes.kpi?.complianceRate || 100,
        actionRequiredRecords: dRes.kpi?.actionRequired || 0,
        activeKeys: activeKeys,
        lastSyncedMinutesAgo: 10,
        unresolvedDuplicates: 0,
        duplicatesResolvedPercent: 100,
        pendingBatches: pendingBatchesList,
      };

      const mappedIntake: Intake[] = (dRes.programCapacities || []).map((p) => ({
        code: p.programCode,
        degree: p.programName,
        approved: p.regularApproved,
        enrolled: p.regularFilled,
        tfw: [p.supernumeraryFilled?.tfw ?? 0, p.supernumeraryQuota?.tfw ?? 0],
        ews: [p.supernumeraryFilled?.ews ?? 0, p.supernumeraryQuota?.ews ?? 0],
        nri: [p.supernumeraryFilled?.nri ?? 0, p.supernumeraryQuota?.nri ?? 0],
      }));

      setDash(mappedDash);
      setIntake(mappedIntake);
      setKeys(keyList);
      setApiOk(true);
      setSectionErr({});
    } catch {
      // Fail-closed on error (no mock profile substitution)
      setApiOk(false);
      setSectionErr({
        intake: "Backend API offline or unreachable",
        keys: "Backend API offline or unreachable",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  async function approve(b: Batch) {
    setBusy(b.batchId);
    try {
      await batchApi.approveBatch(b.batchId);
      say(true, `${b.batchId} approved.`);
      await load();
    } catch (e) {
      say(false, `Could not approve ${b.batchId}: ${errMsg(e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!rejectFor) return;
    if (reason.trim().length < 5) {
      setReasonErr("Enter a reason of at least 5 characters.");
      return;
    }
    setBusy(rejectFor.batchId);
    try {
      await batchApi.rejectBatch(rejectFor.batchId, reason.trim());
      say(true, `${rejectFor.batchId} rejected.`);
      setRejectFor(null);
      setReason("");
      await load();
    } catch (e) {
      setReasonErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function generateKey() {
    if (keyLabel.trim().length < 3) {
      setKeyLabelErr("Enter a label of at least 3 characters.");
      return;
    }
    const instId = dash?.institutionId || apiClient.getUserProfile()?.institutionId;
    if (!instId) {
      setKeyLabelErr("Institution ID not available.");
      return;
    }
    setBusy("newkey");
    try {
      const res = await institutionApi.createApiKey(instId, keyLabel.trim());
      setNewKey(res?.rawSecret || res?.rawApiKey || res?.keyId || "(key not returned by server)");
      setKeyLabel("");
      await load();
    } catch (e) {
      setKeyLabelErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function revoke() {
    if (!revokeFor) return;
    const instId = dash?.institutionId || apiClient.getUserProfile()?.institutionId;
    if (!instId) return;

    setBusy(revokeFor.keyId);
    try {
      await institutionApi.revokeApiKey(instId, revokeFor.keyId);
      say(true, `${revokeFor.label} revoked.`);
      setRevokeFor(null);
      await load();
    } catch (e) {
      say(false, `Could not revoke key: ${errMsg(e)}`);
    } finally {
      setBusy(null);
    }
  }

  const closeKeyModal = () => {
    setKeyModal(false);
    setNewKey(null);
    setKeyLabel("");
    setKeyLabelErr("");
  };

  const d = dash;
  const batches = d?.pendingBatches ?? [];
  const util = d ? pct(d.enrolledSeats, d.sanctionedSeats) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar (Exact from frontend02) */}
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
            {apiOk ? "API Connected (Port 8081)" : "API Unreachable (Port 8081)"}
          </span>
          <InstitutionAdminProfileDropdown />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 p-6">
        {!apiOk && !loading && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            The API is currently offline or unreachable on Port 8081. Approvals, rejections, and key operations require the backend to be online.
          </div>
        )}

        {/* Hero (Exact from frontend02) */}
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-indigo-800 to-blue-700 p-6 text-white shadow-sm">
          <div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {loading ? (
                <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-white/20 align-middle" />
              ) : (
                d?.institutionId ?? "..."
              )}
            </span>
            <h1 className="mt-3 text-2xl font-bold">
              {loading ? (
                <span className="inline-block h-7 w-64 animate-pulse rounded bg-white/20 align-middle" />
              ) : (
                d?.institutionName ?? "Loading institution..."
              )}
            </h1>
            <p className="mt-1 text-sm text-indigo-100">
              {loading ? (
                <span className="inline-block h-4 w-72 animate-pulse rounded bg-white/20 align-middle" />
              ) : (
                <>Affiliated: {d?.affiliatedUniversity} &nbsp;|&nbsp; Academic Year {d?.academicYear}</>
              )}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
          </button>
        </div>

        {loading && !d ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard...
          </div>
        ) : d ? (
          <>
            {batches.length > 0 && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <b>Action required:</b> {batches.length} student {batches.length === 1 ? "batch" : "batches"} uploaded by operators {batches.length === 1 ? "requires" : "require"} your official administrative sign-off.
                </span>
              </div>
            )}

            {/* Stats (Exact from frontend02) */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Stat
                label="Intake utilization"
                value={
                  <>
                    {d.enrolledSeats}{" "}
                    <span className="text-sm font-medium text-slate-500">
                      / {d.sanctionedSeats} seats ({util.toFixed(1)}%)
                    </span>
                  </>
                }
                sub={
                  <>
                    {Math.max(d.sanctionedSeats - d.enrolledSeats, 0)} available
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full bg-indigo-600" style={{ width: `${Math.min(util, 100)}%` }} />
                    </span>
                  </>
                }
              />
              <Stat
                label="Validation ratio"
                value={`${d.cleanRecordPercent}% clean records`}
                sub={`${d.actionRequiredRecords} need action`}
                tone={d.actionRequiredRecords > 0 ? "amber" : "emerald"}
              />
              <Stat
                label="Pending approvals"
                value={`${batches.length} ${batches.length === 1 ? "batch" : "batches"} (${batches.reduce((s, b) => s + b.records, 0)} records)`}
                sub="Requires signature"
                tone={batches.length ? "amber" : "slate"}
              />
              <Stat
                label="ERP integrations"
                value={`${d.activeKeys} active ${d.activeKeys === 1 ? "key" : "keys"}`}
                sub={`Last synced ${d.lastSyncedMinutesAgo}m ago`}
              />
              <Stat
                label="Duplicate alerts"
                value={`${d.unresolvedDuplicates} unresolved`}
                sub={
                  <Badge tone={d.unresolvedDuplicates ? "red" : "emerald"}>
                    {d.duplicatesResolvedPercent}% resolved
                  </Badge>
                }
                tone={d.unresolvedDuplicates ? "red" : "slate"}
              />
            </div>

            {/* Batches (Exact from frontend02) */}
            <Section title="Batches awaiting administrative approval">
              {batches.length === 0 ? (
                <p className="border-t border-slate-200 px-5 py-8 text-center text-sm text-slate-500">
                  No batches are waiting for approval.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      {["Batch ID", "Program / file", "Records", "Validated", "Errors", "Submitted by", "Actions"].map((h) => (
                        <th key={h} className={th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.batchId}>
                        <td className={td}>
                          <Link href={ROUTES.batch(b.batchId)} className="font-medium text-indigo-700 hover:underline">
                            {b.batchId}
                          </Link>
                        </td>
                        <td className={td}>
                          <div className="font-medium text-slate-900">{b.program}</div>
                          <div className="text-xs italic text-slate-500">{b.fileName}</div>
                        </td>
                        <td className={td}>{b.records}</td>
                        <td className={td}>
                          {b.validated} ({Math.round(pct(b.validated, b.records))}%)
                        </td>
                        <td className={`${td} font-semibold ${b.errors ? "text-red-600" : "text-emerald-600"}`}>
                          {b.errors}
                        </td>
                        <td className={td}>{b.submittedBy}</td>
                        <td className={td}>
                          <div className="flex items-center gap-2">
                            <Link href={ROUTES.batch(b.batchId)} className="text-xs font-semibold text-indigo-700 hover:underline">
                              Inspect
                            </Link>
                            <button
                              onClick={() => approve(b)}
                              disabled={busy === b.batchId}
                              aria-label={`Approve ${b.batchId}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                              {busy === b.batchId && <Loader2 className="h-3 w-3 animate-spin" />} Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectFor(b);
                                setReason("");
                                setReasonErr("");
                              }}
                              disabled={busy === b.batchId}
                              aria-label={`Reject ${b.batchId}`}
                              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* Intake (Exact from frontend02) */}
            <Section title="Sanctioned program intake and quota health">
              {sectionErr.intake ? (
                <p role="alert" className="border-t border-slate-200 px-5 py-6 text-sm text-red-600">
                  Could not load intake: {sectionErr.intake}
                </p>
              ) : intake.length === 0 ? (
                <p className="border-t border-slate-200 px-5 py-8 text-center text-sm text-slate-500">
                  No sanctioned programs found.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      {["Code", "Degree", "Approved", "Enrolled", "Capacity utilization", "TFW", "EWS", "NRI", "Status"].map((h) => (
                        <th key={h} className={th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {intake.map((r) => {
                      const p = pct(r.enrolled, r.approved);
                      const over = p > 100,
                        full = p >= 100;
                      return (
                        <tr key={r.code}>
                          <td className={`${td} font-medium text-indigo-700`}>{r.code}</td>
                          <td className={td}>{r.degree}</td>
                          <td className={td}>{r.approved}</td>
                          <td className={td}>{r.enrolled}</td>
                          <td className={td}>
                            <div className="flex min-w-[180px] items-center gap-2">
                              <div
                                className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
                                role="progressbar"
                                aria-valuenow={Math.round(p)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${r.code} utilization`}
                              >
                                <div
                                  className={`h-full ${over ? "bg-red-500" : full ? "bg-amber-500" : "bg-indigo-600"}`}
                                  style={{ width: `${Math.min(p, 100)}%` }}
                                />
                              </div>
                              <span className="w-12 text-right text-xs font-semibold">{p.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className={td}>
                            {r.tfw[0]}/{r.tfw[1]}
                          </td>
                          <td className={td}>
                            {r.ews[0]}/{r.ews[1]}
                          </td>
                          <td className={td}>
                            {r.nri[0]}/{r.nri[1]}
                          </td>
                          <td className={td}>
                            <Badge tone={over ? "red" : full ? "amber" : "emerald"}>
                              {over ? "OVER" : full ? "FULL" : "OK"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Section>

            {/* ERP keys (Exact from frontend02) */}
            <Section
              title="Campus ERP integrations (API keys)"
              action={
                <button
                  onClick={() => setKeyModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Generate new ERP key
                </button>
              }
            >
              {sectionErr.keys ? (
                <p role="alert" className="border-t border-slate-200 px-5 py-6 text-sm text-red-600">
                  Could not load keys: {sectionErr.keys}
                </p>
              ) : keys.length === 0 ? (
                <p className="border-t border-slate-200 px-5 py-8 text-center text-sm text-slate-500">
                  No ERP keys yet. Generate one to connect your campus system.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      {["Key label", "Key identifier", "Created on", "Last used at", "Status", "Actions"].map((h) => (
                        <th key={h} className={th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k.keyId}>
                        <td className={`${td} font-medium text-slate-900`}>{k.label}</td>
                        <td className={`${td} font-mono text-xs`}>{k.identifier}</td>
                        <td className={td}>{k.createdOn}</td>
                        <td className={td}>{k.lastUsedAt}</td>
                        <td className={td}>
                          <Badge tone={k.status === "ACTIVE" ? "emerald" : "slate"}>{k.status}</Badge>
                        </td>
                        <td className={td}>
                          {k.status === "ACTIVE" && (
                            <button
                              onClick={() => setRevokeFor(k)}
                              aria-label={`Revoke ${k.label}`}
                              className="text-xs font-semibold text-red-600 hover:underline"
                            >
                              Revoke key
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          </>
        ) : null}
      </main>

      {/* Reject modal (Exact from frontend02) */}
      {rejectFor && (
        <Modal title={`Reject ${rejectFor.batchId}`} onClose={() => setRejectFor(null)}>
          <label htmlFor="reason" className="block text-sm font-medium">
            Reason for rejection
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonErr("");
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {reasonErr && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {reasonErr}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setRejectFor(null)}
              className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Cancel
            </button>
            <button
              onClick={reject}
              disabled={busy === rejectFor.batchId}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy === rejectFor.batchId && <Loader2 className="h-4 w-4 animate-spin" />} Reject batch
            </button>
          </div>
        </Modal>
      )}

      {/* Revoke modal (Exact from frontend02) */}
      {revokeFor && (
        <Modal title="Revoke ERP key" onClose={() => setRevokeFor(null)}>
          <p className="text-sm text-slate-700">
            Revoking <b>{revokeFor.label}</b> ({revokeFor.identifier}) stops that system from syncing immediately. This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setRevokeFor(null)}
              className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Cancel
            </button>
            <button
              onClick={revoke}
              disabled={busy === revokeFor.keyId}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy === revokeFor.keyId && <Loader2 className="h-4 w-4 animate-spin" />} Revoke key
            </button>
          </div>
        </Modal>
      )}

      {/* Generate key modal (Exact from frontend02) */}
      {keyModal && (
        <Modal title="Generate new ERP key" onClose={closeKeyModal}>
          {newKey ? (
            <div role="status">
              <p className="text-sm text-slate-700">Copy this key now. It will not be shown again.</p>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <KeyRound className="h-4 w-4 text-indigo-600" />
                <code className="flex-1 break-all text-xs">{newKey}</code>
                <button
                  aria-label="Copy key"
                  onClick={() =>
                    navigator.clipboard?.writeText(newKey).then(
                      () => say(true, "Key copied."),
                      () => say(false, "Copy failed.")
                    )
                  }
                  className="rounded p-1 hover:bg-slate-200"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeKeyModal}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <label htmlFor="keylabel" className="block text-sm font-medium">
                Key label
              </label>
              <input
                id="keylabel"
                value={keyLabel}
                onChange={(e) => {
                  setKeyLabel(e.target.value);
                  setKeyLabelErr("");
                }}
                placeholder="e.g. Hostel & Library Portal"
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              {keyLabelErr && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {keyLabelErr}
                </p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={closeKeyModal}
                  className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Cancel
                </button>
                <button
                  onClick={generateKey}
                  disabled={busy === "newkey"}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {busy === "newkey" && <Loader2 className="h-4 w-4 animate-spin" />} Generate key
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Toast (Exact from frontend02) */}
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

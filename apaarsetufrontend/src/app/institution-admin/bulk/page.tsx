"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  Download,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Rocket,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
  RefreshCw,
} from "lucide-react";
import { batchApi, dashboardApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BatchResponseDTO, ProgramCapacityProgressDTO } from "@/types/api";
import InstitutionAdminProfileDropdown from "@/components/layout/InstitutionAdminProfileDropdown";

const ACADEMIC_YEARS = ["2026-27", "2025-26"];
const MAX_UPLOAD_MB = 25;
const IN_FLIGHT = ["UPLOADING", "PROCESSING", "PARSING", "VALIDATING"];

type FilterKey = "ALL" | "ACTION" | "VALID";

export default function BulkUploadPage() {
  const [programs, setPrograms] = useState<{ code: string; name: string }[]>([]);
  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const { user } = useAuth();
  const [institutionName, setInstitutionName] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("apaarsetu_user_profile") || localStorage.getItem("apaarsetu_user");
        if (u) {
          const parsed = JSON.parse(u);
          return parsed.institutionName || parsed.fullName || "";
        }
      } catch { }
    }
    return "";
  });
  const [institutionId, setInstitutionId] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("apaarsetu_user_profile") || localStorage.getItem("apaarsetu_user");
        if (u) {
          const parsed = JSON.parse(u);
          return parsed.institutionId || "";
        }
      } catch { }
    }
    return "";
  });

  useEffect(() => {
    if (user) {
      if (user.institutionId && !institutionId) {
        setInstitutionId(user.institutionId);
      }
      if (user.fullName && !institutionName) {
        setInstitutionName(user.fullName);
      }
    }
  }, [user, institutionId, institutionName]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [apiOk, setApiOk] = useState(true);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Form state
  const [year, setYear] = useState(ACADEMIC_YEARS[0]);
  const [prog, setProg] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [upErr, setUpErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Filter
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Load programs & batches from real backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, batchRes] = await Promise.allSettled([
        dashboardApi.getInstitution(),
        batchApi.getBatches({ page: 0, size: 20 }),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value) {
        const d = dashRes.value;
        if (d.institutionName) setInstitutionName(d.institutionName);
        if (d.institutionId) setInstitutionId(d.institutionId);

        if (d.programCapacities && d.programCapacities.length > 0) {
          const progs = d.programCapacities.map((p: ProgramCapacityProgressDTO) => ({
            code: p.programCode,
            name: p.programName || p.programCode,
          }));
          setPrograms(progs);
          setProg((cur) => cur || progs[0]?.code || "");
        } else {
          setPrograms([
            { code: "CS101", name: "Computer Science & Engineering" },
            { code: "IT102", name: "Information Technology" },
          ]);
          setProg((cur) => cur || "CS101");
        }
      }

      if (batchRes.status === "fulfilled" && batchRes.value) {
        setBatches(batchRes.value.content || []);
      }
      setApiOk(true);
    } catch {
      setApiOk(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll in-flight batches
  useEffect(() => {
    const hasInFlight = batches.some((b) => IN_FLIGHT.includes(String(b.status)));
    if (!hasInFlight) return;

    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await batchApi.getBatches({ page: 0, size: 20 });
        if (res && res.content) {
          setBatches(res.content);
        }
      } catch {
        // silently ignore background polling error
      } finally {
        setPolling(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [batches]);

  // Download template
  const handleDownloadTemplate = async () => {
    setBusy("template");
    try {
      const blob = await batchApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `apaar_enrollment_template_${prog || "standard"}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      notify(true, "Official enrollment template downloaded successfully.");
    } catch (err) {
      notify(false, err instanceof Error ? err.message : "Failed to download template.");
    } finally {
      setBusy(null);
    }
  };

  // File drop & pick
  const pick = (f?: File) => {
    if (!f) return;
    setUpErr("");
    const ext = f.name.toLowerCase();
    if (!ext.endsWith(".csv") && !ext.endsWith(".xlsx")) {
      setUpErr("Only CSV or XLSX spreadsheets are accepted.");
      return;
    }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUpErr(`File size exceeds limit (${MAX_UPLOAD_MB} MB).`);
      return;
    }
    setFile(f);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDrag(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const discard = () => {
    setFile(null);
    setUpErr("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // Upload & ingest batch
  const handleIngest = async () => {
    if (!file) {
      setUpErr("Please select a valid CSV or XLSX file to ingest.");
      return;
    }
    setBusy("upload");
    setUpErr("");
    try {
      const res = await batchApi.uploadBatch(file, year, prog || "CS101");
      notify(true, `Batch ${res.id || "submitted"} successfully uploaded for asynchronous validation!`);
      discard();
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Batch ingestion failed.";
      setUpErr(msg);
      notify(false, msg);
    } finally {
      setBusy(null);
    }
  };

  // Stats calculation
  const totalUploadedBatches = batches.length;
  const partiallyValidBatches = batches.filter(
    (b) => String(b.status) === "PARTIALLY_VALID" || (b.summary && (b.summary.invalidFormatCount > 0 || b.summary.anomalyFlagCount > 0))
  );
  const validatedBatches = batches.filter(
    (b) => String(b.status) === "VALIDATED" || String(b.status) === "APPROVED" || String(b.status) === "COMMITTED"
  );

  const shownFeed = batches.filter((b) => {
    const isAction =
      String(b.status) === "PARTIALLY_VALID" || (b.summary && (b.summary.invalidFormatCount > 0 || b.summary.anomalyFlagCount > 0));
    if (filter === "ACTION") return isAction;
    if (filter === "VALID") return !isAction;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-indigo-600" />
          <div>
            <p className="text-sm font-bold text-slate-900">
              {institutionName || (loading ? <span className="inline-block h-4 w-40 animate-pulse rounded bg-slate-200" /> : "Institution Portal")}{" "}
              <span className="font-medium text-slate-500">
                {institutionId ? `| ${institutionId}` : loading ? <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-slate-200" /> : ""}
              </span>
            </p>
            <p className="text-xs text-slate-500">APAAR Portal · Unified Admissions &amp; Ingestion Center</p>
          </div>
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
          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh queue"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <InstitutionAdminProfileDropdown />
        </div>
      </header>

      {/* Page Title & KPI cards */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Batch Processing</p>
          <h1 className="text-2xl font-black text-slate-900">Bulk Student Ingestion & Live Pipeline</h1>
        </div>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Academic Year {year}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Total Batches Processed"
          value={String(totalUploadedBatches)}
          sub="Ingested enrollment batches"
        />
        <Stat
          label="Action Required (Errors)"
          value={String(partiallyValidBatches.length)}
          sub="Batches with demographic or quota mismatches"
        />
        <Stat
          label="Validated & Committed"
          value={String(validatedBatches.length)}
          sub="Ready for administrative sign-off"
        />
      </div>

      {/* 1. Ingestion Control Box */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">
            1. Upload Student Enrollment Batch
          </h2>
          <p className="text-xs text-slate-500">
            Select your academic department and upload student admissions list for automatic AICTE APAAR validation.
          </p>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-2">
          {/* Left selectors */}
          <div className="space-y-4">
            <div>
              <label htmlFor="bulk-year" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Academic Year
              </label>
              <select
                id="bulk-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bulk-prog" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Program / Department Code
              </label>
              <select
                id="bulk-prog"
                value={prog}
                onChange={(e) => setProg(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                {programs.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-bold text-slate-700">Need the official enrollment format?</p>
              <p className="mt-1 text-xs text-slate-500">
                Pre-configured with columns: First Name, Last Name, APAAR ID, DOB, Seat Category, Quota.
              </p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={busy === "template"}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-indigo-600 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-50"
              >
                {busy === "template" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download Official CSV Template
              </button>
            </div>
          </div>

          {/* Right Drag & Drop */}
          <div className="flex flex-col">
            <label
              htmlFor="bulk-file-input"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              File Ingestion Zone
            </label>
            <input
              ref={fileRef}
              id="bulk-file-input"
              type="file"
              accept=".csv,.xlsx"
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <label
              htmlFor="bulk-file-input"
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={`flex min-h-[190px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${drag
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/30"
                }`}
            >
              <UploadCloud className="mb-2 h-10 w-10 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-700">
                Drag and drop admissions CSV or XLSX file here
              </span>
              <span className="my-1 text-xs text-slate-400">or</span>
              <span className="text-xs font-bold text-indigo-700 hover:underline">
                Click to browse files on your device
              </span>
            </label>

            {file && (
              <div
                className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm"
                role="status"
              >
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">{file.name}</span>
                <span className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  onClick={discard}
                  className="rounded p-1 text-slate-500 hover:text-red-600"
                  title="Discard file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          {upErr ? (
            <p role="alert" className="text-xs font-semibold text-red-600">
              {upErr}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Accepted formats: .csv or .xlsx, up to {MAX_UPLOAD_MB} MB.
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={discard}
              disabled={!file || busy === "upload"}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleIngest}
              disabled={!file || busy === "upload"}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "upload" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingesting...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Begin Ingestion
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Live Ingestion Queue Feed */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="flex items-center gap-3 text-base font-bold text-slate-900">
            2. Live Batch Queue & Validation Feed
            {polling && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                <Loader2 className="h-3 w-3 animate-spin" /> Updating live
              </span>
            )}
          </h2>
          <div role="tablist" aria-label="Filter batches" className="flex gap-2">
            {(
              [
                ["ALL", "All Batches"],
                ["ACTION", "Needs Remediation"],
                ["VALID", "Clean / Ready"],
              ] as [FilterKey, string][]
            ).map(([k, l]) => (
              <button
                key={k}
                role="tab"
                aria-selected={filter === k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${filter === k
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50"
                  }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading ingestion queue...
            </div>
          ) : shownFeed.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm font-medium text-slate-500">
              {batches.length === 0
                ? "No student enrollment batches uploaded yet. Upload a file above to begin validation."
                : "No batches match the selected filter."}
            </p>
          ) : (
            shownFeed.map((b) => {
              const statusStr = String(b.status || "VALIDATED");
              const inflight = IN_FLIGHT.includes(statusStr);
              const validCount = b.summary?.validatedCount ?? 0;
              const totalCount = b.summary?.totalRows ?? (validCount || 1);
              const errorCount =
                (b.summary?.invalidFormatCount ?? 0) +
                (b.summary?.anomalyFlagCount ?? 0) +
                (b.summary?.duplicateCount ?? 0);

              const borderCls =
                statusStr === "FAILED"
                  ? "border-red-300"
                  : errorCount > 0 || statusStr === "PARTIALLY_VALID"
                    ? "border-amber-300"
                    : "border-emerald-300";

              return (
                <article
                  key={b.id}
                  className={`flex h-full flex-col rounded-2xl border-2 bg-white p-5 shadow-sm transition hover:shadow-md ${borderCls}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{b.id}</p>
                      <p className="truncate text-xs text-slate-500">{b.fileName}</p>
                    </div>
                    <Badge
                      tone={
                        errorCount === 0 && !inflight
                          ? "emerald"
                          : errorCount > 0
                            ? "amber"
                            : "indigo"
                      }
                    >
                      {statusStr}
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    Academic Year: {b.academicYear || "2026-27"}
                  </p>

                  <div className="mt-3">
                    <Stepper status={statusStr} hasErrors={errorCount > 0} />
                  </div>

                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700">
                    <div className="flex justify-between font-semibold">
                      <span>{totalCount} Total Records</span>
                      <span className="text-emerald-700">{validCount} Valid</span>
                    </div>
                    {errorCount > 0 && (
                      <div className="mt-1 font-bold text-red-600">
                        {errorCount} Row-level errors / conflicts
                      </div>
                    )}
                  </div>

                  <div className="mt-auto space-y-3 border-t border-slate-100 pt-4">
                    <p className="text-[11px] text-slate-400">
                      Uploaded: {b.createdAt ? new Date(b.createdAt).toLocaleString("en-IN") : "Recently"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      {errorCount > 0 && (
                        <Link
                          href={`/institution-admin/apaar?batchId=${encodeURIComponent(b.id)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Correct {errorCount} errors inline
                        </Link>
                      )}

                      <Link
                        href={`/institution-admin/review/audit?batchId=${encodeURIComponent(b.id)}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-600 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                      >
                        <Search className="h-3.5 w-3.5" /> Inspect & Audit
                      </Link>

                      {(statusStr === "PENDING" || statusStr === "VALIDATED") && (
                        <Link
                          href={`/institution-admin/review?batchId=${encodeURIComponent(b.id)}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                          <Check className="h-3.5 w-3.5" /> Review for Sign-off
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${toast.ok ? "bg-emerald-600" : "bg-red-600"
            }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "emerald" | "amber" | "red" | "indigo";
  children: ReactNode;
}) {
  const c = {
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  }[tone];
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${c}`}>
      {children}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function Stepper({ status, hasErrors }: { status: string; hasErrors: boolean }) {
  const idx = { UPLOADING: 0, PARSING: 1, VALIDATING: 2 }[status] ?? 3;
  const last = status === "FAILED" ? "Failed" : hasErrors ? "Needs Action" : "Validated";
  const labels = ["Uploaded", "Parsed", "Validation", last];

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" aria-label="Ingestion progress">
      {labels.map((l, i) => {
        const done = i < idx;
        const active = i === idx;
        const finalTone =
          status === "FAILED" ? "text-red-600" : hasErrors ? "text-amber-700" : "text-emerald-700";

        return (
          <li
            key={l}
            className={`flex items-center gap-1 font-semibold ${done ? "text-emerald-700" : active ? (idx === 3 ? finalTone : "text-indigo-700") : "text-slate-400"
              }`}
          >
            {i + 1}. {l}
            {done && <Check className="h-3 w-3" />}
            {active && idx < 3 && <Loader2 className="h-3 w-3 animate-spin" />}
            {i < 3 && <span className="ml-1 text-slate-300">&rarr;</span>}
          </li>
        );
      })}
    </ol>
  );
}

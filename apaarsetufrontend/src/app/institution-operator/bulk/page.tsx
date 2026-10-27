"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { batchApi, institutionApi, apiClient } from "@/lib/api";
import { BatchResponseDTO, ApprovedProgramDTO } from "@/types/api";
import InstitutionOperatorProfileDropdown from "@/components/layout/InstitutionOperatorProfileDropdown";

const ACADEMIC_YEARS = ["2026-27", "2025-26"];
const TEMPLATE_COLUMNS = [
  "firstName",
  "lastName",
  "apaarId",
  "dob",
  "gender",
  "seatCategory",
  "guardianName",
];
const MAX_UPLOAD_MB = 25;
const IN_FLIGHT = ["UPLOADING", "PARSING", "VALIDATING", "PROCESSING"];

/* ============ HELPERS ============ */
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
function ago(iso?: string) {
  if (!iso) return "recently";
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1
    ? "just now"
    : m < 60
    ? `${m} minute${m === 1 ? "" : "s"} ago`
    : m < 1440
    ? `${Math.round(m / 60)} hours ago`
    : `${Math.round(m / 1440)} days ago`;
}

function Stepper({ b }: { b: BatchResponseDTO }) {
  const status = b.status?.toUpperCase() || "PROCESSING";
  const isDone = status === "APPROVED" || status === "VALIDATED";
  const isNeedsAction = status === "PARTIALLY_VALID" || (b.invalidRecordsCount || 0) > 0;
  const isFailed = status === "REJECTED" || status === "FAILED";

  const idx = isDone || isNeedsAction || isFailed ? 3 : 2;
  const lastLabel = isFailed
    ? "Rejected / Failed"
    : isNeedsAction
    ? "Needs Action"
    : "Validated Ready";

  const labels = ["Uploaded", "Parsed", "Validation Verified", lastLabel];

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" aria-label="Ingestion progress">
      {labels.map((l, i) => {
        const done = i < idx;
        const active = i === idx;
        const finalTone = isFailed
          ? "text-red-600 font-semibold"
          : isNeedsAction
          ? "text-amber-700 font-semibold"
          : "text-emerald-700 font-semibold";

        return (
          <li
            key={l}
            className={`flex items-center gap-1 font-medium ${
              done
                ? "text-emerald-700"
                : active
                ? idx === 3
                  ? finalTone
                  : "text-indigo-700"
                : "text-slate-400"
            }`}
          >
            <span>
              {i + 1}. {l}
            </span>
            {done && <Check className="h-3 w-3 text-emerald-600" />}
            {active && idx < 3 && <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />}
            {i < 3 && <span className="ml-1 text-slate-300" aria-hidden="true">&rarr;</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

/* ============ PAGE COMPONENT ============ */
export default function BulkUploadPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [programs, setPrograms] = useState<ApprovedProgramDTO[]>([]);
  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [program, setProgram] = useState("CS101");
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [upErr, setUpErr] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cachedProfile = mounted ? apiClient.getUserProfile() : null;
  const instId = user?.institutionId || cachedProfile?.institutionId || "AICTE-INST-1001";
  const instName =
    user?.institutionName ||
    cachedProfile?.institutionName ||
    "Delhi Institute of Technology & Management";

  const showToast = useCallback((text: string, ok = true) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const loadData = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const [batchesRes, progRes] = await Promise.allSettled([
          batchApi.getBatches({ page: 0, size: 30 }),
          apiClient.get<ApprovedProgramDTO[]>(`/institutions/${instId}/approved-programs`),
        ]);

        if (batchesRes.status === "fulfilled") {
          setBatches(batchesRes.value.content || []);
        }
        if (progRes.status === "fulfilled" && Array.isArray(progRes.value)) {
          setPrograms(progRes.value);
          if (progRes.value.length > 0 && !program) {
            setProgram(progRes.value[0].programCode || "CS101");
          }
        }
      } catch {
        showToast("Error synchronizing ingestion data with server.", false);
      } finally {
        setLoading(false);
      }
    },
    [instId, program, showToast]
  );

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  // Polling for in-flight batches
  const hasInFlight = batches.some((b) => IN_FLIGHT.includes(b.status?.toUpperCase() || ""));
  useEffect(() => {
    if (!hasInFlight) return;
    const interval = setInterval(() => loadData(true), 5000);
    return () => clearInterval(interval);
  }, [hasInFlight, loadData]);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  };

  const pickFile = (f: File) => {
    setUpErr("");
    if (!/\.(csv|xlsx)$/i.test(f.name)) {
      setUpErr("Please select a valid .csv or .xlsx spreadsheet file.");
      setFile(null);
      return;
    }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUpErr(`File size exceeds maximum permitted limit (${MAX_UPLOAD_MB} MB).`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const discardFile = () => {
    setFile(null);
    setUpErr("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleIngestSubmit = async () => {
    if (!file) {
      setUpErr("Choose a spreadsheet file to ingest.");
      return;
    }
    setBusy("upload");
    setUpErr("");
    try {
      const res = await batchApi.uploadBatch(file, academicYear, program);
      showToast(`Batch '${res.id || file.name}' queued successfully. Validation started.`);
      discardFile();
      await loadData(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Batch ingestion failed. Verify CSV headers.";
      setUpErr(msg);
      showToast(msg, false);
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await batchApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `apaar_enrollment_template_${program}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Official CSV template downloaded.");
    } catch {
      showToast("Failed to download template. Please try again.", false);
    }
  };

  const pendingBatches = batches.filter(
    (b) => (b.invalidRecordsCount || 0) > 0 && b.status !== "APPROVED"
  );
  const totalIngestedRecords = batches.reduce(
    (s, b) => s + (b.validRecordsCount || 0) + (b.invalidRecordsCount || 0),
    0
  );
  const committedRecords = batches
    .filter((b) => b.status === "APPROVED")
    .reduce((s, b) => s + (b.validRecordsCount || 0), 0);

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

      {/* Header Banner */}
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-300" />
              Ingestion Terminal
            </span>
            <span className="text-xs text-slate-400">
              {instName} ({instId})
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Bulk Student Upload & Ingestion Center
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Download official templates, upload bulk admission files, and track real-time validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-violet-300" : ""}`} />
            <span>Sync</span>
          </button>
          <InstitutionOperatorProfileDropdown />
        </div>
      </header>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total Batches Uploaded"
          value={`${batches.length} Batches`}
          sub="Processed in current cycle"
        />
        <Stat
          label="Total Ingested Records"
          value={`${totalIngestedRecords.toLocaleString("en-IN")} Records`}
          sub="Cumulative records parsed"
        />
        <Stat
          label="Pending Remediation"
          value={`${pendingBatches.length} Batches`}
          sub={`${pendingBatches.reduce((s, b) => s + (b.invalidRecordsCount || 0), 0)} errors to resolve`}
        />
        <Stat
          label="Committed to Registry"
          value={`${committedRecords.toLocaleString("en-IN")} Records`}
          sub="Approved and finalized"
        />
      </div>

      {/* Main Grid: Upload Desk & Template Specs */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Upload Desk */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-800">
              1. File Upload & Cohort Specification
            </h2>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Get CSV Template</span>
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Program
                </label>
                <select
                  value={program}
                  onChange={(e) => {
                    setProgram(e.target.value);
                    setUpErr("");
                  }}
                  className={inputClass}
                >
                  {programs.length > 0 ? (
                    programs.map((p) => (
                      <option key={p.programCode} value={p.programCode}>
                        {p.programName} ({p.programCode})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="CS101">Computer Science & Engineering (CS101)</option>
                      <option value="IT102">Information Technology (IT102)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className={inputClass}
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
                drag
                  ? "border-indigo-600 bg-indigo-50/50"
                  : file
                  ? "border-emerald-500 bg-emerald-50/30"
                  : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                ref={fileRef}
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickFile(f);
                }}
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <FileSpreadsheet className="h-10 w-10 text-emerald-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB • Valid format selected
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      discardFile();
                    }}
                    className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-800">
                    Drop CSV/XLSX file here, or{" "}
                    <span className="text-indigo-600 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts max {MAX_UPLOAD_MB} MB file with student records.
                  </p>
                </div>
              )}
            </div>

            {upErr && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{upErr}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                AICTE verification engine validates format, duplicate APAAR, and seat quotas.
              </span>
              <button
                type="button"
                disabled={!file || busy === "upload"}
                onClick={handleIngestSubmit}
                className={btnPrimary}
              >
                {busy === "upload" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading Batch...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Upload & Ingest Batch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Template Specification */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-800">
              2. Official Template Specification & Requirements
            </h2>
          </div>

          <div className="p-6 space-y-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">
              Your CSV upload file must strictly match these required header columns:
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              {TEMPLATE_COLUMNS.map((col) => (
                <div
                  key={col}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-slate-800"
                >
                  <Check className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{col}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2 text-amber-900">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Important Ingestion Rules
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <span className="font-semibold">APAAR ID</span>: Exactly 12 numeric digits without hyphens.
                </li>
                <li>
                  <span className="font-semibold">DOB</span>: Must be in YYYY-MM-DD format (e.g. 2005-08-15).
                </li>
                <li>
                  <span className="font-semibold">Seat Category</span>: REGULAR_GENERAL, REGULAR_RESERVED, TFW, EWS, or NRI.
                </li>
                <li>
                  Intake caps are validated against approved AICTE quota figures.
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <Download className="h-4 w-4 text-indigo-600" />
                <span>Download Sample CSV Template File</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Live Ingestion Feed & Batch Progress Table */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-800">
            3. Live Ingestion Feed & Validation Tracking
          </h2>
          <span className="text-xs text-slate-500">
            Showing {batches.length} batches
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No batches processed yet. Upload a batch above to begin.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {batches.map((b) => {
              const hasErrors = (b.invalidRecordsCount || 0) > 0;
              return (
                <div key={b.id} className="p-6 transition hover:bg-slate-50/60">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{b.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-mono text-slate-600">{b.fileName}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{ago(b.createdAt)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <span className="font-semibold text-emerald-600">
                          {b.validRecordsCount || 0} passed
                        </span>
                        {hasErrors && (
                          <span className="font-semibold text-amber-600">
                            {b.invalidRecordsCount} invalid / errors
                          </span>
                        )}
                        <span className="text-slate-400">
                          Total: {(b.validRecordsCount || 0) + (b.invalidRecordsCount || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasErrors && (
                        <Link
                          href={`/institution-operator/apaar?batchId=${b.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition shadow-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Correct Errors Inline</span>
                        </Link>
                      )}
                      <Link
                        href={`/institution-operator/apaar?batchId=${b.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Inspect Records</span>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Stepper b={b} />
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

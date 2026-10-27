"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  Download,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { batchApi, dashboardApi, studentApi, apiClient, institutionApi } from "@/lib/api";
import {
  BatchResponseDTO,
  BatchErrorDTO,
  InstitutionDashboardDTO,
  ProgramCapacityDTO,
} from "@/types/api";
import InstitutionOperatorProfileDropdown from "@/components/layout/InstitutionOperatorProfileDropdown";

const MAX_UPLOAD_MB = 25;
const SEAT_CATEGORIES = ["REGULAR_GENERAL", "REGULAR_RESERVED", "TFW", "EWS", "NRI"];

type Radar = { code: string; name: string; enrolled: number; approved: number };
type ErrRow = {
  row: number;
  studentName: string;
  field: string;
  ruleCode: string;
  remedy: string;
  currentValue: string;
};

/* ============ HELPERS ============ */
const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

function ago(iso?: string) {
  if (!iso) return "recently";
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1
    ? "just now"
    : m < 60
    ? `${m}m ago`
    : m < 1440
    ? `${Math.round(m / 60)}h ago`
    : `${Math.round(m / 1440)}d ago`;
}

const fmtApaar = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 12)
    .replace(/(\d{4})(?=\d)/g, "$1-");

/* ============ UI COMPONENTS ============ */
function Badge({ status }: { status: string }) {
  const s = status?.toUpperCase() || "PENDING";
  if (s === "APPROVED" || s === "VALIDATED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        {s}
      </span>
    );
  }
  if (s === "PARTIALLY_VALID" || s === "ACTION_REQUIRED" || s === "NEEDS_ACTION") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
        <AlertTriangle className="h-3 w-3" />
        {s.replace("_", " ")}
      </span>
    );
  }
  if (s === "REJECTED" || s === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
        <AlertCircle className="h-3 w-3" />
        {s}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
      <Loader2 className="h-3 w-3 animate-spin" />
      {s}
    </span>
  );
}

function Stat({
  label,
  value,
  unit,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub: ReactNode;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${tone ?? "text-slate-900"}`}>
        {value}{" "}
        {unit && <span className="text-xs font-medium text-slate-400 uppercase">{unit}</span>}
      </p>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function Panel({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        {actions && <div>{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-white">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-lg p-1 text-white/80 hover:bg-white/20 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50";

/* ============ MAIN OPERATOR DASHBOARD ============ */
export default function OperatorDashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<InstitutionDashboardDTO | null>(null);
  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [upProgram, setUpProgram] = useState("CS101");
  const [upErr, setUpErr] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Single Student Registration Form State
  const [st, setSt] = useState({
    name: "",
    apaarId: "",
    dob: "",
    program: "CS101",
    seat: "REGULAR_GENERAL",
  });
  const [stErr, setStErr] = useState<Record<string, string>>({});

  // Inline Correction Modal State
  const [fixingBatch, setFixingBatch] = useState<BatchResponseDTO | null>(null);
  const [fixRows, setFixRows] = useState<ErrRow[]>([]);
  const [fixVals, setFixVals] = useState<Record<string, string>>({});
  const [fixLoading, setFixLoading] = useState(false);
  const [fixErr, setFixErr] = useState("");

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, batchesRes] = await Promise.allSettled([
        dashboardApi.getInstitution(academicYear),
        batchApi.getBatches({ page: 0, size: 20 }),
      ]);

      if (dashRes.status === "fulfilled") {
        setDashData(dashRes.value);
      }
      if (batchesRes.status === "fulfilled") {
        setBatches(batchesRes.value.content || []);
      }
    } catch {
      showToast("Could not load latest dashboard data. Please try again.", false);
    } finally {
      setLoading(false);
    }
  }, [academicYear, showToast]);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  // Derived KPI statistics
  const totalEnrolled = dashData?.kpi?.totalUploaded ?? batches.reduce((acc, b) => acc + (b.validRecordsCount || 0), 0);
  const cleanValidated = dashData?.kpi?.validated ?? batches.reduce((acc, b) => acc + (b.summary?.validatedCount || 0), 0);
  const errorCount = dashData?.kpi?.actionRequired ?? batches.reduce((acc, b) => acc + (b.invalidRecordsCount || 0), 0);
  const approvedBatches = batches.filter((b) => b.status === "APPROVED").length;
  const pendingBatches = batches.filter((b) => (b.status as string) === "PARTIALLY_VALID" || b.status === "PROCESSING" || b.status === "FLAGGED").length;

  const radarPrograms: Radar[] = (dashData?.programCapacities || []).map((p: ProgramCapacityDTO) => ({
    code: p.programCode,
    name: p.programName,
    enrolled: p.regularFilled,
    approved: p.regularApproved,
  }));

  // Fallback radar if API returned empty
  const displayRadar: Radar[] = radarPrograms.length > 0 ? radarPrograms : [
    { code: "CS101", name: "Computer Science & Engineering", enrolled: 13, approved: 120 },
    { code: "IT102", name: "Information Technology", enrolled: 0, approved: 60 },
  ];

  /* ============ BULK UPLOAD HANDLERS ============ */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  };

  const validateAndSetFile = (f: File) => {
    setUpErr("");
    if (!f.name.toLowerCase().endsWith(".csv") && !f.name.toLowerCase().endsWith(".xlsx")) {
      setUpErr("Only .csv and .xlsx spreadsheet files are accepted.");
      return;
    }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUpErr(`File size exceeds maximum permitted limit (${MAX_UPLOAD_MB} MB).`);
      return;
    }
    setFile(f);
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setUpErr("Please select a valid CSV or XLSX batch file to proceed.");
      return;
    }
    setBusy("upload");
    setUpErr("");
    try {
      const res = await batchApi.uploadBatch(file, academicYear, upProgram);
      showToast(`Batch '${res.id || file.name}' queued successfully for validation.`);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Batch upload failed. Please verify CSV headers.";
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
      a.download = `apaar_enrollment_template_${upProgram}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Template downloaded successfully.");
    } catch {
      showToast("Failed to download template. Please try again.", false);
    }
  };

  /* ============ SINGLE STUDENT ENROLLMENT HANDLER ============ */
  const handleSingleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const rawApaar = st.apaarId.replace(/\D/g, "");

    if (!st.name.trim()) errors.name = "Candidate name is required.";
    if (rawApaar.length !== 12) errors.apaarId = "APAAR ID must be exactly 12 digits.";
    if (!st.dob) errors.dob = "Date of birth is required.";
    if (!st.program) errors.program = "Select an academic program.";

    if (Object.keys(errors).length > 0) {
      setStErr(errors);
      return;
    }

    setBusy("single");
    setStErr({});
    try {
      const parts = st.name.trim().split(" ");
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ") || "Student";

      await studentApi.createStudent({
        fullName: st.name.trim(),
        apaarId: rawApaar,
        dateOfBirth: st.dob,
        gender: "OTHER",
        nationality: "INDIAN",
        programCode: st.program,
        academicYear,
        seatCategory: st.seat as any,
        admissionStatus: "ADMITTED_ACTIVE",
        admissionDate: new Date().toISOString().slice(0, 10),
      });

      showToast(`Student ${st.name} successfully validated and registered.`);
      setSt({ name: "", apaarId: "", dob: "", program: "CS101", seat: "REGULAR_GENERAL" });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      showToast(msg, false);
    } finally {
      setBusy(null);
    }
  };

  /* ============ INLINE ERROR CORRECTION HANDLERS ============ */
  const openFixModal = async (batch: BatchResponseDTO) => {
    setFixingBatch(batch);
    setFixLoading(true);
    setFixErr("");
    try {
      const errors = await batchApi.getBatchErrors(batch.id);
      const rows: ErrRow[] = errors.map((err: BatchErrorDTO) => ({
        row: err.rowNumber || 1,
        studentName: err.studentName || "Student Candidate",
        field: err.fieldName || "seat_category",
        ruleCode: err.ruleCode || "VALIDATION_ERROR",
        remedy: err.errorMessage || "Validation failed.",
        currentValue: err.invalidValue || "",
      }));
      setFixRows(rows);
      const initialVals: Record<string, string> = {};
      rows.forEach((r) => {
        initialVals[`${r.row}-${r.field}`] = r.currentValue;
      });
      setFixVals(initialVals);
    } catch (e: unknown) {
      setFixErr("Failed to fetch batch validation errors.");
    } finally {
      setFixLoading(false);
    }
  };

  const handleSaveAndRevalidate = async () => {
    if (!fixingBatch) return;
    setBusy("revalidate");
    setFixErr("");
    try {
      const corrections = fixRows.map((r) => ({
        rowNumber: r.row,
        fieldName: r.field,
        correctedValue: fixVals[`${r.row}-${r.field}`] ?? r.currentValue,
      }));

      await batchApi.revalidateBatch(fixingBatch.id, { corrections });
      showToast(`Batch ${fixingBatch.id} revalidated successfully.`);
      setFixingBatch(null);
      loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Revalidation failed.";
      setFixErr(msg);
      showToast(msg, false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
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

      {/* Top Banner Header */}
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-300" />
              Operator Ingestion Desk
            </span>
            <span className="text-xs text-slate-400">
              {instName} ({instId})
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Student Enrollment & Ingestion Terminal
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Intake quota enforcement, real-time APAAR verification, and bulk CSV processing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-2 backdrop-blur-xs ring-1 ring-white/15">
            <Calendar className="h-4 w-4 text-violet-300" />
            <select
              aria-label="Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-hidden"
            >
              <option value="2026-27" className="bg-slate-900 text-white">
                AY 2026-2027
              </option>
              <option value="2025-26" className="bg-slate-900 text-white">
                AY 2025-2026
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-violet-300" : ""}`} />
            <span>Refresh</span>
          </button>

          <InstitutionOperatorProfileDropdown />
        </div>
      </header>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total Uploaded"
          value={totalEnrolled}
          unit="Records"
          sub="Cumulative student records parsed"
        />
        <Stat
          label="Clean Validated"
          value={cleanValidated}
          unit="Students"
          sub={`${pct(cleanValidated, totalEnrolled || 1)}% validated without issues`}
          tone="text-emerald-600"
        />
        <Stat
          label="Action Required"
          value={errorCount}
          unit="Errors"
          sub="Discrepancies needing operator review"
          tone={errorCount > 0 ? "text-amber-600" : "text-slate-900"}
        />
        <Stat
          label="Submission Batches"
          value={batches.length}
          unit="Batches"
          sub={`${approvedBatches} Approved • ${pendingBatches} Pending`}
        />
      </div>

      {/* Main Grid: Left Column (Bulk Upload & Queue), Right Column (Single Student & Capacity) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Two Columns */}
        <div className="space-y-8 lg:col-span-2">
          {/* Bulk Ingestion Panel */}
          <Panel
            title="Bulk Student Batch Ingestion"
            actions={
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Sample Template</span>
              </button>
            }
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Target Program
                  </label>
                  <select
                    value={upProgram}
                    onChange={(e) => setUpProgram(e.target.value)}
                    className={inputClass}
                  >
                    {displayRadar.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    disabled
                    value={academicYear}
                    className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
                  />
                </div>
              </div>

              {/* Drag & Drop Area */}
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
                    if (f) validateAndSetFile(f);
                  }}
                />

                {file ? (
                  <div className="flex flex-col items-center">
                    <FileSpreadsheet className="h-10 w-10 text-emerald-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • Ready for validation
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileRef.current) fileRef.current.value = "";
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
                      Drop enrollment spreadsheet here, or{" "}
                      <span className="text-indigo-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports official CSV or XLSX format up to {MAX_UPLOAD_MB} MB.
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
                  Batches are validated asynchronously against AICTE intake & APAAR format.
                </span>
                <button
                  type="button"
                  disabled={!file || busy === "upload"}
                  onClick={handleUploadSubmit}
                  className={btnPrimary}
                >
                  {busy === "upload" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Ingesting Batch...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Batch for Ingestion</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Panel>

          {/* Ingestion Queue & History Table */}
          <Panel
            title="Batch Ingestion History & Error Correction"
            actions={
              <Link
                href="/institution-operator/bulk"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View Full Bulk Desk →
              </Link>
            }
          >
            {batches.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No ingestion batches submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Batch ID / File</th>
                      <th className="py-3 px-4">Records</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((b) => {
                      const hasErrors = (b.invalidRecordsCount || 0) > 0;
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900">{b.id}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              {b.fileName}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <span className="font-semibold text-emerald-600">
                              {b.validRecordsCount || 0} passed
                            </span>
                            {hasErrors && (
                              <span className="ml-1 text-amber-600 font-semibold">
                                / {b.invalidRecordsCount} errors
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge status={b.status} />
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                            {ago(b.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasErrors && (
                                <button
                                  type="button"
                                  onClick={() => openFixModal(b)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                                >
                                  <Pencil className="h-3 w-3" />
                                  <span>Fix Errors</span>
                                </button>
                              )}
                              <Link
                                href={`/institution-operator/apaar?batchId=${b.id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <span>Inspect</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        {/* Right Column: Single Student Entry & Program Capacity */}
        <div className="space-y-8">
          {/* Quick Single Student Entry */}
          <Panel title="Single Candidate Direct Enrollment">
            <form onSubmit={handleSingleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={st.name}
                  onChange={(e) => setSt({ ...st, name: e.target.value })}
                  className={inputClass}
                />
                {stErr.name && <p className="mt-1 text-xs text-red-600">{stErr.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  12-Digit APAAR ID
                </label>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="xxxx-xxxx-xxxx"
                  value={st.apaarId}
                  onChange={(e) => setSt({ ...st, apaarId: fmtApaar(e.target.value) })}
                  className={inputClass}
                />
                {stErr.apaarId && <p className="mt-1 text-xs text-red-600">{stErr.apaarId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={st.dob}
                    onChange={(e) => setSt({ ...st, dob: e.target.value })}
                    className={inputClass}
                  />
                  {stErr.dob && <p className="mt-1 text-xs text-red-600">{stErr.dob}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seat Category
                  </label>
                  <select
                    value={st.seat}
                    onChange={(e) => setSt({ ...st, seat: e.target.value })}
                    className={inputClass}
                  >
                    {SEAT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.replace("REGULAR_", "")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enrolled Program
                </label>
                <select
                  value={st.program}
                  onChange={(e) => setSt({ ...st, program: e.target.value })}
                  className={inputClass}
                >
                  {displayRadar.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={busy === "single"}
                className={`${btnPrimary} w-full mt-2`}
              >
                {busy === "single" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Validating with AICTE...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    <span>Validate & Enrol Candidate</span>
                  </>
                )}
              </button>
            </form>
          </Panel>

          {/* Program Capacity Quota Radar */}
          <Panel title="Program Capacity Radar">
            <div className="space-y-4">
              {displayRadar.map((p) => {
                const fillPct = pct(p.enrolled, p.approved);
                const isFull = p.enrolled >= p.approved;
                return (
                  <div key={p.code} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{p.name}</span>
                      <span className="font-semibold text-slate-600">
                        {p.enrolled} / {p.approved} seats ({fillPct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isFull
                            ? "bg-red-500"
                            : fillPct > 80
                            ? "bg-amber-500"
                            : "bg-indigo-600"
                        }`}
                        style={{ width: `${Math.min(100, fillPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      {/* Inline Error Correction Modal */}
      {fixingBatch && (
        <Modal
          title={`Correct Ingestion Discrepancies — ${fixingBatch.id}`}
          onClose={() => setFixingBatch(null)}
        >
          {fixLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
              <p className="mt-3 text-sm text-slate-500">Loading batch errors...</p>
            </div>
          ) : fixRows.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No validation discrepancies found in this batch.
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-slate-600">
                Update the flagged fields below and click{" "}
                <span className="font-semibold text-slate-900">Save & Revalidate</span> to
                resubmit.
              </p>

              {fixErr && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {fixErr}
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Candidate</th>
                      <th className="py-2.5 px-3">Field</th>
                      <th className="py-2.5 px-3">Issue / Remedy</th>
                      <th className="py-2.5 px-3">Corrected Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fixRows.map((r) => {
                      const cellKey = `${r.row}-${r.field}`;
                      return (
                        <tr key={cellKey} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-500">
                            #{r.row}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {r.studentName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {r.field}
                          </td>
                          <td className="py-2.5 px-3 text-red-600">{r.remedy}</td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={fixVals[cellKey] ?? ""}
                              onChange={(e) =>
                                setFixVals({ ...fixVals, [cellKey]: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs focus:border-indigo-600 focus:outline-hidden"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFixingBatch(null)}
                  className={btnOutline}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy === "revalidate"}
                  onClick={handleSaveAndRevalidate}
                  className={btnPrimary}
                >
                  {busy === "revalidate" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Revalidating...</span>
                    </>
                  ) : (
                    <span>Save & Revalidate</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { batchApi, apiClient } from "@/lib/api";
import { BatchResponseDTO, BatchErrorDTO } from "@/types/api";
import InstitutionOperatorProfileDropdown from "@/components/layout/InstitutionOperatorProfileDropdown";

const SEAT_CATEGORIES = ["REGULAR_GENERAL", "REGULAR_RESERVED", "TFW", "EWS", "NRI"];

type ErrRow = {
  row: number;
  studentName: string;
  field: string;
  currentValue: string;
  ruleCode: string;
  description: string;
  suggestedValue?: string;
};

/* ============ HELPERS ============ */
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const key = (r: ErrRow) => `${r.row}-${r.field}`;
const isDate = (f: string) => /(^|_)(dob|date_of_birth)$/i.test(f);

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

function validateField(field: string, value: string): string {
  const v = (value || "").trim();
  if (!v) return "Value is required.";
  if (field === "apaarId" || field === "apaar_id") {
    const raw = v.replace(/\D/g, "");
    if (raw.length !== 12) return "APAAR ID must be 12 digits.";
  }
  if (isDate(field)) {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "Enter a valid date (YYYY-MM-DD).";
    if (d > new Date()) return "Date of birth cannot be in the future.";
  }
  return "";
}

function Card({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string | number;
  note: string;
  tone?: "red" | "emerald" | "amber";
}) {
  const border =
    tone === "red"
      ? "border-red-200"
      : tone === "emerald"
        ? "border-emerald-200"
        : tone === "amber"
          ? "border-amber-200"
          : "border-slate-200/80";
  const text =
    tone === "red"
      ? "text-red-600"
      : tone === "emerald"
        ? "text-emerald-600"
        : tone === "amber"
          ? "text-amber-600"
          : "text-slate-900";

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-xs ${border}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${text}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

/* ============ INNER VALIDATION DESK ============ */
function ValidationDesk() {
  const searchParams = useSearchParams();
  const paramId = searchParams.get("batchId");
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(paramId || "");
  const [rows, setRows] = useState<ErrRow[]>([]);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loadingRows, setLoadingRows] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState("");
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

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

  // Load batches list
  const loadBatches = useCallback(async () => {
    try {
      const res = await batchApi.getBatches({ page: 0, size: 50 });
      const batchList = res.content || [];
      setBatches(batchList);

      if (!selectedBatchId && batchList.length > 0) {
        // Default to first batch with errors or first batch
        const firstWithErr = batchList.find((b) => (b.invalidRecordsCount || 0) > 0);
        setSelectedBatchId(firstWithErr ? firstWithErr.id : batchList[0].id);
      }
    } catch {
      showToast("Failed to load batch list from server.", false);
    }
  }, [selectedBatchId, showToast]);

  useEffect(() => {
    setMounted(true);
    loadBatches();
  }, [loadBatches]);

  // Load details and error rows when selectedBatchId changes
  const loadSelectedBatchErrors = useCallback(
    async (batchId: string) => {
      if (!batchId) return;
      setLoadingRows(true);
      setActionErr("");
      try {
        const errors = await batchApi.getBatchErrors(batchId);
        const errList: BatchErrorDTO[] = errors || [];
        const errRows: ErrRow[] = errList.map((err) => ({
          row: err.rowNumber || 1,
          studentName: err.studentName || "Candidate",
          field: err.fieldName || "seat_category",
          currentValue: err.invalidValue || "",
          ruleCode: err.ruleCode || "VALIDATION_ERROR",
          description: err.errorMessage || "Discrepancy detected.",
          suggestedValue: err.suggestedValue,
        }));

        setRows(errRows);
        const initialVals: Record<string, string> = {};
        errRows.forEach((r) => {
          initialVals[key(r)] = r.suggestedValue || r.currentValue;
        });
        setVals(initialVals);
      } catch {
        setActionErr("Could not retrieve batch validation error breakdown.");
      } finally {
        setLoadingRows(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedBatchId) {
      loadSelectedBatchErrors(selectedBatchId);
    }
  }, [selectedBatchId, loadSelectedBatchErrors]);

  const handleSaveAndRevalidate = async () => {
    if (!selectedBatchId) return;
    setBusy(true);
    setActionErr("");

    // Check for client validation errors
    for (const r of rows) {
      const err = validateField(r.field, vals[key(r)] ?? r.currentValue);
      if (err) {
        setActionErr(`Row #${r.row} (${r.field}): ${err}`);
        setBusy(false);
        return;
      }
    }

    try {
      const corrections = rows.map((r) => ({
        rowNumber: r.row,
        fieldName: r.field,
        correctedValue: vals[key(r)] ?? r.currentValue,
      }));

      await batchApi.revalidateBatch(selectedBatchId, { corrections });
      showToast(`Batch ${selectedBatchId} revalidated successfully.`);
      await loadBatches();
      await loadSelectedBatchErrors(selectedBatchId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Revalidation failed.";
      setActionErr(msg);
      showToast(msg, false);
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadReport = () => {
    if (rows.length === 0) {
      showToast("No errors to export for this batch.", false);
      return;
    }
    const headers = "Row,Candidate Name,Field,Rule Code,Current Value,Error Description\n";
    const csvContent =
      headers +
      rows
        .map(
          (r) =>
            `${r.row},"${r.studentName}","${r.field}","${r.ruleCode}","${r.currentValue}","${r.description}"`
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `error_report_${selectedBatchId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Error report downloaded.");
  };

  const currentBatchSummary = batches.find((b) => b.id === selectedBatchId);
  const totalRecords =
    (currentBatchSummary?.validRecordsCount || 0) +
    (currentBatchSummary?.invalidRecordsCount || 0);
  const passedRecords = currentBatchSummary?.validRecordsCount || 0;
  const errorRecords = currentBatchSummary?.invalidRecordsCount || 0;

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-xl ring-1 transition animate-in fade-in slide-in-from-bottom-4 ${toast.ok
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
            <Link
              href="/institution-operator"
              className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Operator Terminal</span>
            </Link>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">
              {instName} ({instId})
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            APAAR Validation & Inline Discrepancy Correction Desk
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Fix demographic format errors, AICTE intake overflows, and duplicate APAAR records inline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => selectedBatchId && loadSelectedBatchErrors(selectedBatchId)}
            disabled={loadingRows}
            className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loadingRows ? "animate-spin text-violet-300" : ""}`} />
            <span>Reload Batch</span>
          </button>
          <InstitutionOperatorProfileDropdown />
        </div>
      </header>

      {/* Batch Selector Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label htmlFor="batchSelect" className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Active Batch:
          </label>
          <select
            id="batchSelect"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} — {b.fileName} (
                {(b.invalidRecordsCount || 0) > 0
                  ? `${b.invalidRecordsCount} errors`
                  : b.status}
                )
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            <span>Download Error Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards for the Selected Batch */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="Total Records in Batch"
          value={totalRecords}
          note="Total student admissions parsed"
        />
        <Card
          label="Clean Validated"
          value={passedRecords}
          note={`${pct(passedRecords, totalRecords || 1)}% passed validation`}
          tone="emerald"
        />
        <Card
          label="Validation Errors"
          value={errorRecords}
          note="Records requiring operator correction"
          tone={errorRecords > 0 ? "red" : "emerald"}
        />
        <Card
          label="Batch Ingestion Status"
          value={currentBatchSummary?.status || "UNKNOWN"}
          note={`Submitted ${ago(currentBatchSummary?.createdAt)}`}
          tone={currentBatchSummary?.status === "APPROVED" ? "emerald" : "amber"}
        />
      </div>

      {/* Inline Discrepancy Correction Desk */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Inline Discrepancy Correction Table ({rows.length} Flagged Fields)
            </h2>
            <p className="text-xs text-slate-500">
              Edit the values directly in the table and click Save &amp; Revalidate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy || rows.length === 0}
              onClick={handleSaveAndRevalidate}
              className={btnPrimary}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Revalidating...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Save &amp; Revalidate Batch</span>
                </>
              )}
            </button>
          </div>
        </div>

        {actionErr && (
          <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionErr}</span>
          </div>
        )}

        {loadingRows ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm text-slate-500">Loading error discrepancies for {selectedBatchId}...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
            <p className="text-base font-semibold text-slate-800">
              No validation discrepancies in batch {selectedBatchId}!
            </p>
            <p className="text-xs text-slate-500 mt-1">
              All parsed student records in this batch are valid and verified.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Row #</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Flagged Field</th>
                  <th className="py-3 px-4">Rule Violated</th>
                  <th className="py-3 px-4">Error Description &amp; Remedy</th>
                  <th className="py-3 px-4 min-w-[200px]">Current Value</th>
                  <th className="py-3 px-4 min-w-[220px]">Corrected Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const k = key(r);
                  const isSeat = r.field.toLowerCase().includes("category") || r.field.toLowerCase().includes("seat");

                  return (
                    <tr key={k} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-500">#{r.row}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.studentName}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 bg-slate-50 rounded">
                        {r.field}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200/60 font-mono">
                          {r.ruleCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[280px]">
                        {r.description}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 line-through">
                        {r.currentValue || "(empty)"}
                      </td>
                      <td className="py-3 px-4">
                        {isSeat ? (
                          <select
                            value={vals[k] ?? r.currentValue}
                            onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
                            className={inputClass}
                          >
                            {SEAT_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c.replace("REGULAR_", "")}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={vals[k] ?? ""}
                            placeholder="Enter corrected value"
                            onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
                            className={inputClass}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <span className="text-xs text-slate-500">
            Revalidation runs automated integrity checks against APAAR registry rules and quota caps.
          </span>
          <button
            type="button"
            disabled={busy || rows.length === 0}
            onClick={handleSaveAndRevalidate}
            className={btnPrimary}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving &amp; Revalidating...</span>
              </>
            ) : (
              <span>Save &amp; Revalidate All</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function OperatorApaarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <ValidationDesk />
    </Suspense>
  );
}

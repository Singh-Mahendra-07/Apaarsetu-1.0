"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import InstitutionAdminSidebar from "@/components/layout/institutionAdminSidebar";
import { batchApi, dashboardApi } from "@/lib/api";
import { BatchResponseDTO, BatchDetailDTO, BatchErrorDTO } from "@/types/api";

function ValidationDesk() {
  const searchParams = useSearchParams();
  const paramId = searchParams.get("batchId");

  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(paramId ?? "");
  const [detail, setDetail] = useState<BatchDetailDTO | null>(null);
  const [errors, setErrors] = useState<BatchErrorDTO[]>([]);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionErr, setActionErr] = useState("");
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const [institutionName, setInstitutionName] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("apaarsetu_user");
        if (u) {
          const parsed = JSON.parse(u);
          return parsed.institutionName || "";
        }
      } catch {}
    }
    return "";
  });
  const [institutionId, setInstitutionId] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("apaarsetu_user");
        if (u) {
          const parsed = JSON.parse(u);
          return parsed.institutionId || "";
        }
      } catch {}
    }
    return "";
  });

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Load Institution info & list of batches
  const loadBatches = useCallback(async () => {
    setLoadingBatches(true);
    setActionErr("");
    try {
      const [dashRes, batchRes] = await Promise.allSettled([
        dashboardApi.getInstitution(),
        batchApi.getBatches({ page: 0, size: 50 }),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value) {
        if (dashRes.value.institutionName) setInstitutionName(dashRes.value.institutionName);
        if (dashRes.value.institutionId) setInstitutionId(dashRes.value.institutionId);
      }

      if (batchRes.status === "fulfilled" && batchRes.value?.content) {
        const allBatches = batchRes.value.content;
        setBatches(allBatches);

        // Auto-select batch from query param or the first batch that has errors/needs attention
        if (paramId && allBatches.some((b) => b.id === paramId)) {
          setSelectedBatchId(paramId);
        } else if (!selectedBatchId && allBatches.length > 0) {
          const withErrors = allBatches.find(
            (b) =>
              String(b.status) === "PARTIALLY_VALID" ||
              (b.summary && (b.summary.invalidFormatCount > 0 || b.summary.anomalyFlagCount > 0))
          );
          setSelectedBatchId(withErrors ? withErrors.id : allBatches[0].id);
        }
      }
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : "Failed to load batches from database.");
    } finally {
      setLoadingBatches(false);
    }
  }, [paramId, selectedBatchId]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  // Load batch detail and errors whenever selected batch changes
  const loadBatchErrors = useCallback(async (batchId: string) => {
    if (!batchId) {
      setDetail(null);
      setErrors([]);
      return;
    }
    setLoadingDetail(true);
    setCorrections({});
    setActionErr("");

    try {
      const [detailRes, errorsRes] = await Promise.allSettled([
        batchApi.getBatchById(batchId),
        batchApi.getBatchErrors(batchId),
      ]);

      if (detailRes.status === "fulfilled" && detailRes.value) {
        setDetail(detailRes.value);
      }
      if (errorsRes.status === "fulfilled" && errorsRes.value) {
        setErrors(errorsRes.value);
      }
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : "Failed to load batch errors.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadBatchErrors(selectedBatchId);
    }
  }, [selectedBatchId, loadBatchErrors]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? null;

  const getRowKey = (err: BatchErrorDTO) => `${err.rowNumber}-${err.fieldName}`;

  const getInitialValue = (err: BatchErrorDTO) => {
    const val = err.invalidValue ?? "";
    if (val === "INVALID_FORMAT" || val === "{empty}" || val === "empty" || val === "null") {
      return "";
    }
    return val;
  };

  const getFieldValue = (err: BatchErrorDTO) => {
    const key = getRowKey(err);
    if (corrections[key] !== undefined) {
      return corrections[key];
    }
    return getInitialValue(err);
  };

  const isRowEdited = (err: BatchErrorDTO) => {
    const key = getRowKey(err);
    const current = corrections[key];
    if (current === undefined) return false;
    const initial = getInitialValue(err);
    return current.trim() !== initial.trim() && current.trim().length > 0;
  };

  const changedRows = errors.filter(isRowEdited);

  const getPlaceholder = (err: BatchErrorDTO) => {
    const norm = (err.fieldName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (norm.includes("apaar")) return "e.g. 982144120042 (12 digits)";
    if (norm.includes("dob") || norm.includes("birth")) return "YYYY-MM-DD (e.g. 2005-04-12)";
    if (norm.includes("seat") || norm.includes("category")) return "e.g. REGULAR_GENERAL, REGULAR, EWS";
    if (norm.includes("parent") || norm.includes("father")) return "e.g. Ramesh Patel (Father / Guardian)";
    return `Enter valid ${err.fieldName}`;
  };

  const handleValueChange = (err: BatchErrorDTO, val: string) => {
    setCorrections((prev) => ({
      ...prev,
      [getRowKey(err)]: val,
    }));
  };

  // Revalidate batch with corrected rows
  const handleRevalidate = async () => {
    if (!selectedBatchId) return;
    setActionErr("");

    if (changedRows.length === 0) {
      setActionErr("Please correct at least one row value before requesting re-validation.");
      return;
    }

    setSubmitting(true);
    try {
      const payloadCorrections = changedRows.map((err) => ({
        rowNumber: err.rowNumber,
        studentName: err.studentName,
        apaarId: err.apaarId,
        fieldName: err.fieldName,
        invalidValue: err.invalidValue,
        correctedValue: getFieldValue(err).trim(),
        correctedData: {
          [err.fieldName]: getFieldValue(err).trim(),
        },
      }));

      await batchApi.revalidateBatch(selectedBatchId, {
        corrections: payloadCorrections,
      });

      // Clear pending edits cache
      setCorrections({});

      notify(true, `Batch ${selectedBatchId} re-validated successfully! AICTE database updated.`);
      await loadBatches();
      await loadBatchErrors(selectedBatchId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Revalidation failed.";
      setActionErr(msg);
      notify(false, msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Export error report as CSV
  const handleDownloadErrorReport = () => {
    if (!errors.length) return;
    const headers = ["Row", "Student Name", "APAAR ID", "Field", "Invalid Value", "Error Rule", "Description"];
    const rows = errors.map((e) => [
      e.rowNumber,
      `"${e.studentName || ""}"`,
      `"${e.apaarId || ""}"`,
      `"${e.fieldName}"`,
      `"${e.invalidValue || ""}"`,
      `"${e.ruleCode}"`,
      `"${e.errorMessage.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `error_report_${selectedBatchId || "batch"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify(true, "Error report exported.");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-indigo-600" />
          <div>
            <p className="text-sm font-bold text-slate-900">
              {institutionName || (loadingBatches ? <span className="inline-block h-4 w-40 animate-pulse rounded bg-slate-200" /> : "Institution Portal")}{" "}
              <span className="font-medium text-slate-500">
                {institutionId ? `| ${institutionId}` : loadingBatches ? <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-slate-200" /> : ""}
              </span>
            </p>
            <p className="text-xs text-slate-500">APAAR Portal · Validation &amp; Demographic Remediation Desk</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadBatches();
              if (selectedBatchId) loadBatchErrors(selectedBatchId);
            }}
            disabled={loadingBatches || loadingDetail}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingBatches || loadingDetail ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/institution-admin/bulk"
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Bulk Upload
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Data Quality & Remediation</p>
              <h1 className="text-2xl font-black text-slate-900">APAAR Demographic & Format Validation Desk</h1>
            </div>
            {selectedBatch && (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
                Batch: {selectedBatch.id} ({selectedBatch.academicYear || "2026-27"})
              </span>
            )}
          </div>

          {actionErr && (
            <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <span>{actionErr}</span>
              <button onClick={() => setActionErr("")} className="text-red-500 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Batch Selector & Summary Cards */}
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="select-batch" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Select Batch:
              </label>
              <select
                id="select-batch"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                {batches.map((b) => {
                  const errorCount =
                    (b.summary?.invalidFormatCount ?? 0) +
                    (b.summary?.anomalyFlagCount ?? 0) +
                    (b.summary?.duplicateCount ?? 0);
                  return (
                    <option key={b.id} value={b.id}>
                      {b.id} — {b.fileName} ({errorCount} errors, {b.summary?.validatedCount ?? 0} valid)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadErrorReport}
                disabled={errors.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-600 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" /> Export Error Report (.CSV)
              </button>
            </div>
          </section>

          {/* 4 Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Row Errors Awaiting Fix</p>
              <p className="mt-1 text-2xl font-black text-red-600">{errors.length} Errors</p>
              <p className="mt-0.5 text-xs text-slate-500">In batch {selectedBatchId || "—"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Validated Records</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">
                {selectedBatch?.summary?.validatedCount ?? 0} Clean
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Passed demographic validation</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Primary Error Category</p>
              <p className="mt-1 text-lg font-black text-slate-900">
                {errors.length > 0 ? errors[0].ruleCode || "Format Check" : "None (All Clean)"}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {errors.length > 0 ? errors[0].errorMessage : "Ready for approval"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">4. Modified In This Session</p>
              <p className="mt-1 text-2xl font-black text-indigo-600">{changedRows.length} Corrected</p>
              <p className="mt-0.5 text-xs text-slate-500">Ready to revalidate</p>
            </div>
          </div>

          {/* Remediation Table */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Inline Batch Error Remediation Table ({selectedBatchId || "No Batch Selected"})
                </h2>
                <p className="text-xs text-slate-500">
                  Edit the values directly in the input boxes below, then click &ldquo;Save &amp; Revalidate Batch&rdquo;.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRevalidate}
                disabled={submitting || changedRows.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Re-validating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Save &amp; Revalidate ({changedRows.length} edits)
                  </>
                )}
              </button>
            </div>

            <div className="overflow-x-auto">
              {loadingDetail ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading validation errors from database...
                </div>
              ) : errors.length === 0 ? (
                <div className="py-16 text-center text-sm font-semibold text-slate-500">
                  🎉 No demographic or validation errors found for this batch. All student records are valid!
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Row #</th>
                      <th className="px-5 py-3">Student Name</th>
                      <th className="px-5 py-3">Field with Error</th>
                      <th className="px-5 py-3">Current / Invalid Value</th>
                      <th className="min-w-[200px] px-5 py-3">Correction Input</th>
                      <th className="px-5 py-3">Rule &amp; Error Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {errors.map((err) => {
                      const rowKey = getRowKey(err);
                      const currentVal = getFieldValue(err);
                      const isEdited = isRowEdited(err);

                      return (
                        <tr key={rowKey} className={`transition ${isEdited ? "bg-amber-50/70" : "hover:bg-slate-50/50"}`}>
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                            Row {err.rowNumber}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                            {err.studentName || "—"}
                            {err.apaarId && (
                              <span className="block font-mono text-[11px] text-slate-400">
                                {err.apaarId}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-indigo-700">
                            {err.fieldName}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-red-600 line-through">
                            {err.invalidValue || "⟨empty⟩"}
                          </td>
                          <td className="px-5 py-4">
                            <input
                              type="text"
                              value={currentVal}
                              onChange={(e) => handleValueChange(err, e.target.value)}
                              placeholder={getPlaceholder(err)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                            />
                            {isEdited && (
                              <span className="mt-0.5 block text-[10px] font-bold text-amber-700">
                                Modified (Pending Save)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              {err.ruleCode}
                            </span>
                            <p className="mt-1 text-xs text-slate-600">
                              {err.errorMessage}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
              toast.ok ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>
    );
}

export default function ApaarValidationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <ValidationDesk />
    </Suspense>
  );
}

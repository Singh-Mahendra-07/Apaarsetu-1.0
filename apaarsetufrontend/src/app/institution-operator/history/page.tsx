"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  History,
  Download,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { batchApi, apiClient } from "@/lib/api";
import { BatchResponseDTO } from "@/types/api";
import InstitutionOperatorProfileDropdown from "@/components/layout/InstitutionOperatorProfileDropdown";

export default function OperatorHistoryPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const cachedProfile = mounted ? apiClient.getUserProfile() : null;
  const instId = user?.institutionId || cachedProfile?.institutionId || "AICTE-INST-1001";
  const instName =
    user?.institutionName ||
    cachedProfile?.institutionName ||
    "Delhi Institute of Technology & Management";

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await batchApi.getBatches({ page: 0, size: 50 });
      setBatches(res.content || []);
    } catch {
      // Handle gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchHistory();
  }, [fetchHistory]);

  const handleExportHistory = () => {
    if (batches.length === 0) return;
    const header = "Batch ID,File Name,Academic Year,Status,Valid Records,Invalid Records,Created At\n";
    const rows = batches
      .map(
        (b) =>
          `"${b.id}","${b.fileName}","${b.academicYear || "2026-27"}","${b.status}",${b.validRecordsCount || 0},${b.invalidRecordsCount || 0},"${b.createdAt}"`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ingestion_history_${instId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">
              <History className="h-3.5 w-3.5 text-violet-300" />
              Ingestion Archive
            </span>
            <span className="text-xs text-slate-400">
              {instName} ({instId})
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Historical Ingestion Logs &amp; Audit Archive
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Complete chronological record of all batch uploads, validation results, and approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportHistory}
            className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>Export Archive (CSV)</span>
          </button>
          <InstitutionOperatorProfileDropdown />
        </div>
      </header>

      {/* History Table */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Past Ingestion Archive ({batches.length} Runs)
          </h2>
          <button
            type="button"
            onClick={fetchHistory}
            className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Archive</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs text-slate-500">Loading historical runs...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No historical ingestion runs recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Spreadsheet File</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Passed Records</th>
                  <th className="py-3 px-4">Flagged Errors</th>
                  <th className="py-3 px-4">Final Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{b.id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{b.fileName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{b.academicYear || "2026-27"}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600">
                      {b.validRecordsCount || 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {(b.invalidRecordsCount || 0) > 0 ? (
                        <span className="font-semibold text-red-600">
                          {b.invalidRecordsCount} errors
                        </span>
                      ) : (
                        <span className="text-emerald-600">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {b.createdAt ? new Date(b.createdAt).toLocaleString("en-IN") : "Recent"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

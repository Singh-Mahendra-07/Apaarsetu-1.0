"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Pencil,
  ExternalLink,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { batchApi, apiClient } from "@/lib/api";
import { BatchResponseDTO } from "@/types/api";
import InstitutionOperatorProfileDropdown from "@/components/layout/InstitutionOperatorProfileDropdown";

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

export default function OperatorSubmissionsPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [batches, setBatches] = useState<BatchResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"ALL" | "NEEDS_ACTION" | "VALIDATED" | "APPROVED">("ALL");

  const cachedProfile = mounted ? apiClient.getUserProfile() : null;
  const instId = user?.institutionId || cachedProfile?.institutionId || "AICTE-INST-1001";
  const instName =
    user?.institutionName ||
    cachedProfile?.institutionName ||
    "Delhi Institute of Technology & Management";

  const fetchBatches = useCallback(async () => {
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
    fetchBatches();
  }, [fetchBatches]);

  const filteredBatches = batches.filter((b) => {
    if (filterTab === "NEEDS_ACTION") return (b.invalidRecordsCount || 0) > 0 && b.status !== "APPROVED";
    if (filterTab === "VALIDATED") return b.status === "VALIDATED";
    if (filterTab === "APPROVED") return b.status === "APPROVED";
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">
              <FileText className="h-3.5 w-3.5 text-violet-300" />
              Submissions Terminal
            </span>
            <span className="text-xs text-slate-400">
              {instName} ({instId})
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Batch Submissions &amp; Lifecycle Tracking
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Track validation progress, view approval statuses, and initiate row-level corrections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/institution-operator/bulk"
            className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Upload New Batch</span>
          </Link>
          <InstitutionOperatorProfileDropdown />
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(["ALL", "NEEDS_ACTION", "VALIDATED", "APPROVED"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterTab(tab)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              filterTab === tab
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab.replace("_", " ")}
            <span className="ml-1.5 rounded-full bg-slate-200/60 px-1.5 py-0.2 text-[10px] text-slate-700">
              {tab === "ALL"
                ? batches.length
                : tab === "NEEDS_ACTION"
                ? batches.filter((b) => (b.invalidRecordsCount || 0) > 0 && b.status !== "APPROVED").length
                : batches.filter((b) => b.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Submissions Table */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs text-slate-500">Loading batch submissions...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No submissions found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Valid Records</th>
                  <th className="py-3 px-4">Discrepancies</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => {
                  const hasErrors = (b.invalidRecordsCount || 0) > 0;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{b.id}</td>
                      <td className="py-3.5 px-4 text-slate-700">{b.fileName}</td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600">
                        {b.validRecordsCount || 0} passed
                      </td>
                      <td className="py-3.5 px-4">
                        {hasErrors ? (
                          <span className="font-semibold text-amber-600">
                            {b.invalidRecordsCount} errors
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={b.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{ago(b.createdAt)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasErrors && (
                            <Link
                              href={`/institution-operator/apaar?batchId=${b.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                            >
                              <Pencil className="h-3 w-3" />
                              <span>Fix Errors</span>
                            </Link>
                          )}
                          <Link
                            href={`/institution-operator/apaar?batchId=${b.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <ExternalLink className="h-3 w-3" />
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
      </section>
    </div>
  );
}

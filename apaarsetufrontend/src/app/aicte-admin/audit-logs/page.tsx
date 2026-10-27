"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, History, RefreshCw } from "lucide-react";

/* -------------------------------- Types -------------------------------- */

type AuditLog = {
  id: string;
  timestamp: string; // ISO string from the API
  action: string; // LOGIN, LOGOUT, ...
  actorEmail: string;
  actorRole: string;
  targetType?: string | null;
  targetId?: string | null;
  clientIp: string;
};

/* ------------------------------ Sample data ------------------------------ */
// Shown only if GET /api/v1/audit-logs can't be reached.

const SAMPLE: AuditLog[] = [
  { id: "1", timestamp: "2026-10-23T21:19:04", action: "LOGIN", actorEmail: "admin@aicte.gov.in", actorRole: "ROLE_AICTE_ADMIN", clientIp: "127.0.0.1" },
  { id: "2", timestamp: "2026-10-23T19:10:10", action: "LOGIN", actorEmail: "admin@ditm.ac.in", actorRole: "ROLE_INSTITUTION_ADMIN", clientIp: "127.0.0.1" },
  { id: "3", timestamp: "2026-10-23T19:08:27", action: "LOGIN", actorEmail: "admin@aicte.gov.in", actorRole: "ROLE_AICTE_ADMIN", clientIp: "127.0.0.1" },
  { id: "4", timestamp: "2026-10-23T19:08:15", action: "LOGIN", actorEmail: "admin@aicte.gov.in", actorRole: "ROLE_AICTE_ADMIN", clientIp: "127.0.0.1" },
  { id: "5", timestamp: "2026-10-23T08:19:42", action: "LOGIN", actorEmail: "verifier@tcs.com", actorRole: "ROLE_AUTHORIZED_VERIFIER", clientIp: "127.0.0.1" },
  { id: "6", timestamp: "2026-10-23T08:19:25", action: "LOGIN", actorEmail: "operator@ditm.ac.in", actorRole: "ROLE_INSTITUTION_OPERATOR", clientIp: "127.0.0.1" },
  { id: "7", timestamp: "2026-10-23T08:19:14", action: "LOGIN", actorEmail: "admin@ditm.ac.in", actorRole: "ROLE_INSTITUTION_ADMIN", clientIp: "127.0.0.1" },
  { id: "8", timestamp: "2026-10-23T08:19:05", action: "LOGOUT", actorEmail: "admin@aicte.gov.in", actorRole: "ROLE_AICTE_ADMIN", clientIp: "127.0.0.1" },
  { id: "9", timestamp: "2026-10-23T08:18:54", action: "LOGIN", actorEmail: "admin@aicte.gov.in", actorRole: "ROLE_AICTE_ADMIN", clientIp: "127.0.0.1" },
  { id: "10", timestamp: "2026-10-23T08:18:43", action: "LOGOUT", actorEmail: "officer@aicte.gov.in", actorRole: "ROLE_AICTE_OFFICER", clientIp: "127.0.0.1" },
];

/* -------------------------------- Helpers -------------------------------- */

const ACTION_CLS: Record<string, string> = {
  LOGIN: "bg-indigo-50 text-indigo-700",
  LOGOUT: "bg-indigo-50 text-indigo-700",
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-amber-50 text-amber-700",
  DELETE: "bg-red-50 text-red-700",
};

// "10/23/2026, 9:19:04 PM"
const formatTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
};

const formatTarget = (log: AuditLog) =>
  `${log.targetType ?? ""}: ${log.targetId ?? "..."}`;

/* --------------------------------- Page --------------------------------- */

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [apiUp, setApiUp] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => setApiUp(r.ok))
      .catch(() => setApiUp(false));

    try {
      const res = await fetch("/api/v1/audit-logs", { cache: "no-store" });
      if (res.ok) {
        setLogs((await res.json()) as AuditLog[]);
        setApiUp(true);
      } else if (res.status === 401 || res.status === 403) {
        setApiUp(true);
      }
    } catch {
      // Network connection error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ------------------------------ Top bar ------------------------------ */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            System Administration
          </p>
          <h2 className="text-xl font-bold">Central Control Center</h2>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
              apiUp
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${apiUp ? "bg-emerald-500" : "bg-red-500"}`} />
            {apiUp ? "API Connected (Port 8081)" : "API Unreachable (Port 8081)"}
          </span>
          <button
            aria-label="Notifications"
            className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              3
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-6">
        <Link
          href="/aicte-admin"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Central Dashboard
        </Link>

        {/* ----------------------------- Main card ----------------------------- */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <History className="h-7 w-7" />
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">Immutable System Audit Logs</h1>
          <p className="mt-3 text-slate-600">
            Review cryptographic administrative actions, access events, and field-level change
            history.
          </p>

          <h3 className="mt-8 text-sm font-bold uppercase tracking-wide">
            Immutable System Audit Log History
          </h3>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-slate-600">
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Actor Email</th>
                  <th className="px-4 py-3 font-medium">Actor Role</th>
                  <th className="px-4 py-3 font-medium">Target Document</th>
                  <th className="px-4 py-3 font-medium">Client IP</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        <span>Loading immutable audit logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : null}
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          ACTION_CLS[log.action] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{log.actorEmail}</td>
                    <td className="px-4 py-3 text-slate-700">{log.actorRole}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{formatTarget(log)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-400">{log.clientIp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

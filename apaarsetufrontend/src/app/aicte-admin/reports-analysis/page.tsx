"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Download, FileBarChart2, Loader2 } from "lucide-react";

/* ------------------------------ Report config ------------------------------ */
// Change `endpoint` to match your Spring Boot report routes.

type Report = {
  key: string;
  title: string;
  description: string;
  endpoint: string;
  filename: string;
};

const REPORTS: Report[] = [
  {
    key: "enrollment",
    title: "National Enrollment CSV",
    description: "Comprehensive report of all enrolled student APAAR records nationwide.",
    endpoint: "/api/v1/reports/national-enrollment",
    filename: "national-enrollment.csv",
  },
  {
    key: "capacity",
    title: "Capacity Violations CSV",
    description:
      "Institutions exceeding approved AICTE regular or supernumerary quotas.",
    endpoint: "/api/v1/reports/capacity-violations",
    filename: "capacity-violations.csv",
  },
  {
    key: "discrepancy",
    title: "Discrepancy Analysis CSV",
    description:
      "Ranked listing of colleges with highest rate of invalid or flagged APAAR records.",
    endpoint: "/api/v1/reports/discrepancy-analysis",
    filename: "discrepancy-analysis.csv",
  },
];

/* --------------------------------- Page --------------------------------- */

export default function ReportsPage() {
  const [apiUp, setApiUp] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Check backend health for the status pill (adjust the URL to your health endpoint).
  useEffect(() => {
    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => setApiUp(r.ok))
      .catch(() => setApiUp(false));
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const download = async (report: Report) => {
    setDownloading(report.key);
    try {
      const res = await fetch(report.endpoint, { headers: { Accept: "text/csv" } });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage({ text: `${report.title} downloaded.`, error: false });
    } catch (err) {
      setMessage({
        text: `Could not download ${report.title}. ${
          err instanceof Error ? err.message : ""
        } Check that the API is running and try again.`,
        error: true,
      });
    } finally {
      setDownloading(null);
    }
  };

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
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileBarChart2 className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">Reports &amp; Analytics</h1>
          <p className="mt-3 text-slate-600">
            Export certified regulatory CSV reports and nationwide enrollment analytics.
          </p>

          <h3 className="mt-8 text-sm font-bold uppercase tracking-wide">
            Certified Analytical Reports Export
          </h3>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {REPORTS.map((r) => {
              const busy = downloading === r.key;
              return (
                <article
                  key={r.key}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-5"
                >
                  <h4 className="font-semibold">{r.title}</h4>
                  <p className="mt-1 flex-1 text-sm text-slate-600">{r.description}</p>
                  <button
                    onClick={() => download(r)}
                    disabled={downloading !== null}
                    className="mt-4 inline-flex w-fit items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {busy ? "Downloading..." : "Download CSV"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {message && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 max-w-md -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${
            message.error ? "bg-red-700" : "bg-slate-900"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

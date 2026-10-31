"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

type Request = {
  id: string;
  name: string;
  apaar: string;
  institution: string;
  course: string;
  year: string;
  date: string;
  status: string;
};


const sections: Record<string, { title: string; description: string }> = {
  requests: {
    title: "Verification Requests",
    description: "Browse and select student records assigned for academic credentials verification.",
  },
  exceptions: {
    title: "Exception Queue",
    description: "Review returned records and exceptions requiring investigation.",
  },
  history: {
    title: "Verification History",
    description: "Completed student record reviews and verified credential tokens.",
  },
  reports: {
    title: "Reports & Metrics",
    description: "Summary of processed verification requests and turnaround metrics.",
  },
};

function StatusBadge({ status }: { status: string }) {
  const style: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    "Under Review": "bg-blue-100 text-blue-800",
    Verified: "bg-emerald-100 text-emerald-800",
    Rejected: "bg-rose-100 text-rose-800",
    "Correction Required": "bg-orange-100 text-orange-800",
    Escalated: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${style[status] ?? "bg-slate-100 text-slate-700"
        }`}
    >
      {status}
    </span>
  );
}

function VerificationScreen({
  request,
  onDecision,
}: {
  request: Request;
  onDecision: (status: string, comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  function decide(status: string) {
    if (
      ["Correction Required", "Rejected", "Escalated"].includes(status) &&
      !comment.trim()
    ) {
      setError("Please provide a reason before submitting this decision.");
      return;
    }

    setError("");
    onDecision(status, comment.trim());
  }

  return (
    <div className="space-y-6">
      <Link
        href="/authorized-verifier/requests"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
      >
        <ArrowLeft size={16} /> Back to requests
      </Link>

      <div>
        <p className="text-sm font-medium text-blue-700">
          RECORD REVIEW · {request.id}
        </p>
        <h1 className="mt-2 text-2xl font-bold">Verify Student Record</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review authentic enrollment data against AICTE central registry.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border bg-white p-6">
            <h2 className="font-bold">Student Information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <p className="text-slate-500">Full Name</p>
                <p className="mt-1 font-semibold text-slate-900">{request.name}</p>
              </div>
              <div>
                <p className="text-slate-500">APAAR Identifier</p>
                <p className="mt-1 font-mono font-semibold text-indigo-700">{request.apaar}</p>
              </div>
              <div>
                <p className="text-slate-500">Institution</p>
                <p className="mt-1 font-semibold text-slate-900">{request.institution}</p>
              </div>
              <div>
                <p className="text-slate-500">Course / Branch</p>
                <p className="mt-1 font-semibold text-slate-900">{request.course}</p>
              </div>
              <div>
                <p className="text-slate-500">Academic Year</p>
                <p className="mt-1 font-semibold text-slate-900">{request.year}</p>
              </div>
              <div>
                <p className="text-slate-500">Submission Date</p>
                <p className="mt-1 font-semibold text-slate-900">{request.date}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <h2 className="font-bold">Verification Remarks</h2>
            {error && (
              <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>
            )}
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Record reason for verification, requested correction, or rejection..."
              className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-xs outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => decide("Verified")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
            >
              <CheckCircle2 size={16} /> Verify Credential
            </button>
            <button
              onClick={() => decide("Correction Required")}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              <AlertTriangle size={16} /> Request Correction
            </button>
            <button
              onClick={() => decide("Rejected")}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-5 py-2.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        </section>

        <aside className="rounded-xl border bg-white p-5 h-fit text-xs space-y-3">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-blue-600" />
            Verification Standards
          </h3>
          <ul className="list-disc pl-4 space-y-2 text-slate-600">
            <li>Verify matching 12-digit APAAR format.</li>
            <li>Enforce DPDP consent mandate before viewing unmasked PII.</li>
            <li>Document official verification purpose.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function VerifierSectionInner() {
  const params = useParams<{ session: string }>();
  const searchParams = useSearchParams();
  const section = params?.session || "requests";
  const requestId = searchParams.get("id");

  const [records, setRecords] = useState<Request[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");

  const selected = records.find((record) => record.id === requestId);

  const visibleRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch = [
        record.id,
        record.name,
        record.institution,
        record.course,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter = filter === "All" || record.status === filter;

      const matchesSection =
        section === "exceptions"
          ? ["Correction Required", "Escalated", "Rejected"].includes(record.status)
          : section === "history"
            ? ["Verified", "Rejected", "Correction Required"].includes(record.status)
            : section === "requests"
              ? ["Pending", "Under Review"].includes(record.status)
              : true;

      return matchesSearch && matchesFilter && matchesSection;
    });
  }, [records, search, filter, section]);

  function updateDecision(id: string, status: string, comment: string) {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    setNotice(
      `${id}: Decision updated to "${status}". ${comment ? `Notes: ${comment}` : ""
      }`
    );
  }

  if (section === "verify-student") {
    if (!selected) {
      return (
        <div className="rounded-xl border bg-white p-8">
          <h1 className="text-2xl font-bold">Verify Student</h1>
          <p className="mt-2 text-sm text-slate-500">
            Select a request from the queue to review its student record.
          </p>
          <Link
            href="/authorized-verifier/requests"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white"
          >
            Open Verification Requests
          </Link>
        </div>
      );
    }

    return (
      <>
        {notice && (
          <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs font-medium text-blue-800">
            {notice}
          </p>
        )}
        <VerificationScreen
          request={selected}
          onDecision={(status, comment) =>
            updateDecision(selected.id, status, comment)
          }
        />
      </>
    );
  }

  const page = sections[section] ?? {
    title: "Verification Module",
    description: "Manage academic credential verification queues.",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{page.title}</h1>
        <p className="mt-1 text-xs text-slate-500">{page.description}</p>
      </div>

      {notice && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
          {notice}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, college, or request ID..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-xs outline-none focus:border-blue-600"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs outline-none"
        >
          {["All", "Pending", "Under Review", "Verified", "Correction Required", "Rejected"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Student / Request ID</th>
                <th className="px-5 py-3.5 font-semibold">APAAR ID</th>
                <th className="px-5 py-3.5 font-semibold">Institution / Program</th>
                <th className="px-5 py-3.5 font-semibold">Academic Year</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No verification requests found in this queue.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{record.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{record.id}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-700">{record.apaar}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{record.institution}</p>
                      <p className="text-[11px] text-slate-500">{record.course}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{record.year}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/authorized-verifier/verify-student?id=${record.id}`}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        Review Record
                      </Link>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function VerifierSectionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Loading verifier workspace...</div>}>
      <VerifierSectionInner />
    </Suspense>
  );
}

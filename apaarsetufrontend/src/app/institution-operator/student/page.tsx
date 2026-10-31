"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  UserCheck,
  Loader2,
  RefreshCw,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { studentApi, apiClient } from "@/lib/api";
import { StudentListDTO, PagedResponse } from "@/types/api";
import InstitutionOperatorProfileDropdown from "@/components/layout/InstitutionOperatorProfileDropdown";

export default function OperatorStudentManagementPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<StudentListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [admissionStatus, setAdmissionStatus] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const cachedProfile = mounted ? apiClient.getUserProfile() : null;
  const instId = user?.institutionId || cachedProfile?.institutionId || "AICTE-INST-1001";
  const instName =
    user?.institutionName ||
    cachedProfile?.institutionName ||
    "Delhi Institute of Technology & Management";

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res: PagedResponse<StudentListDTO> = await studentApi.getStudents({
        institutionId: instId,
        keyword: keyword || undefined,
        programCode: programCode || undefined,
        admissionStatus: admissionStatus || undefined,
        page,
        size: 15,
      });
      setStudents(res.content || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  }, [instId, keyword, programCode, admissionStatus, page]);

  useEffect(() => {
    setMounted(true);
    fetchStudents();
  }, [fetchStudents]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">
              <UserCheck className="h-3.5 w-3.5 text-violet-300" />
              Student Registry
            </span>
            <span className="text-xs text-slate-400">
              {instName} ({instId})
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Candidate Records &amp; Enrollment Registry
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Search, filter, and inspect verified APAAR student profiles enrolled across departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/institution-operator"
            className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Enrol Candidate</span>
          </Link>
          <InstitutionOperatorProfileDropdown />
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or APAAR ID..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-xs focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={programCode}
            onChange={(e) => {
              setProgramCode(e.target.value);
              setPage(0);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="">All Programs</option>
            <option value="CS101">CS101 (Computer Science)</option>
            <option value="IT102">IT102 (Information Tech)</option>
          </select>

          <select
            value={admissionStatus}
            onChange={(e) => {
              setAdmissionStatus(e.target.value);
              setPage(0);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="ADMITTED_ACTIVE">Admitted Active</option>
            <option value="PROVISIONAL">Provisional</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            type="button"
            onClick={fetchStudents}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Student Records Table */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Admitted Students ({students.length} Records)
          </h2>
          <span className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs text-slate-500">Loading student registry...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No student records found matching the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">APAAR ID</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Seat Quota</th>
                  <th className="py-3 px-4">DOB</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id || s.apaarId} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {s.fullName || "Student Candidate"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-indigo-600">
                      {s.apaarId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {s.programCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {s.seatCategory?.replace("REGULAR_", "") || "GENERAL"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {s.academicYear || "2026-27"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.admissionStatus === "ADMITTED_ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {s.admissionStatus || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

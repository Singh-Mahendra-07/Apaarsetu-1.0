"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { institutionApi, apiClient } from "@/lib/api";
import { InstitutionResponseDTO, ApprovedProgramDTO } from "@/types/api";
import InstitutionOperatorProfileDropdown from "@/components/layout/InstitutionOperatorProfileDropdown";

export default function OperatorInstitutionProfilePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [inst, setInst] = useState<InstitutionResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cachedProfile = mounted ? apiClient.getUserProfile() : null;
  const instId = user?.institutionId || cachedProfile?.institutionId || "AICTE-INST-1001";

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await institutionApi.getInstitutionById(instId);
      setInst(data);
    } catch {
      setError("Failed to load institution profile from backend.");
    } finally {
      setLoading(false);
    }
  }, [instId]);

  useEffect(() => {
    setMounted(true);
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">
              <Building2 className="h-3.5 w-3.5 text-violet-300" />
              Institution Master Record
            </span>
            <span className="text-xs text-slate-400">Read-Only Operator View</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
            {inst?.name || "Institution Profile"}
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            AICTE Code: {inst?.aicteId || instId} • Status: {inst?.status || "APPROVED"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-violet-300" : ""}`} />
            <span>Reload</span>
          </button>
          <InstitutionOperatorProfileDropdown />
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-3 text-indigo-600 mb-3">
                <MapPin className="h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-800">Campus Location</h3>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {inst?.city || "Delhi"}, {inst?.state || "Delhi"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Zone: {inst?.zone || "NORTH"}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Affiliation: {inst?.universityAffiliation || "Guru Gobind Singh IP University"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-3 text-indigo-600 mb-3">
                <User className="h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-800">Head of Institution</h3>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {inst?.headName || "Dr. Rajeshwar Sharma (Director)"}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{inst?.headEmail || "director@ditm.ac.in"}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{inst?.headPhone || "+91-11-27891234"}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-3 text-indigo-600 mb-3">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-800">Nodal Verification Officer</h3>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {inst?.nodalOfficerName || "Prof. Anand Verma"}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{inst?.nodalOfficerEmail || "nodal@ditm.ac.in"}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{inst?.nodalOfficerPhone || "+91-9811234567"}</span>
              </div>
            </div>
          </div>

          {/* Approved Programs Table */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-800">
                  AICTE Sanctioned Programs &amp; Approved Intakes
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                {inst?.approvedPrograms?.length || 0} Programs Approved
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Program Code</th>
                    <th className="py-3 px-4">Program Name</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Regular Intake</th>
                    <th className="py-3 px-4">EWS Quota</th>
                    <th className="py-3 px-4">TFW Quota</th>
                    <th className="py-3 px-4">NRI / OCI Quota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(inst?.approvedPrograms || []).map((p: ApprovedProgramDTO) => (
                    <tr key={p.programCode} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {p.programCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.programName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {p.level || "UG"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.approvedIntake} Seats
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.supernumeraryQuota?.ews ?? 0}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.supernumeraryQuota?.tfw ?? 0}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {(p.supernumeraryQuota?.nri ?? 0) + (p.supernumeraryQuota?.ociFn ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

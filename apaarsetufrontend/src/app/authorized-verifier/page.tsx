"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  QrCode,
  FileCheck2,
  Building2,
  GraduationCap,
  RefreshCw,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { verificationApi } from "@/lib/api";
import { VerifiedCredentialDTO, VerificationToken, VerificationPurpose } from "@/types/api";

export default function AuthorizedVerifierDashboard() {
  const [activeTab, setActiveTab] = useState<"qr" | "manual" | "history">("qr");

  // QR Verification
  const [qrPayload, setQrPayload] = useState("");
  const [verifyingQr, setVerifyingQr] = useState(false);

  // Manual Verification
  const [manualForm, setManualForm] = useState<{
    apaarId: string;
    purpose: VerificationPurpose;
    consentRef: string;
  }>({
    apaarId: "",
    purpose: "EMPLOYMENT",
    consentRef: "",
  });
  const [verifyingManual, setVerifyingManual] = useState(false);

  // Result Card
  const [result, setResult] = useState<VerifiedCredentialDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<VerificationToken[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await verificationApi.getHistory();
      setHistory(list);
    } catch {
      // Ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleVerifyQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrPayload.trim()) return;
    setVerifyingQr(true);
    setError(null);
    setResult(null);
    try {
      const data = await verificationApi.verifyQr(qrPayload.trim());
      setResult(data);
      loadHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "QR Verification failed");
    } finally {
      setVerifyingQr(false);
    }
  };

  const handleVerifyManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingManual(true);
    setError(null);
    setResult(null);
    try {
      const data = await verificationApi.verifyManual(manualForm);
      setResult(data);
      loadHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Manual verification failed");
    } finally {
      setVerifyingManual(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
            Authorized Verifier Agency Portal
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            Academic Credential Verification Desk
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            Cryptographically verify authentic student records, degree programs, and AICTE approval status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
            DPDP Act 2023 Compliant
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-semibold text-slate-500">
        <button
          onClick={() => {
            setActiveTab("qr");
            setError(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 transition ${
            activeTab === "qr"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          <QrCode size={18} />
          QR Payload Scanner
        </button>

        <button
          onClick={() => {
            setActiveTab("manual");
            setError(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 transition ${
            activeTab === "manual"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          <Search size={18} />
          Consent-Gated APAAR Lookup
        </button>

        <button
          onClick={() => {
            setActiveTab("history");
            loadHistory();
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 transition ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          <FileCheck2 size={18} />
          Agency Audit History ({history.length})
        </button>
      </div>

      {/* Tab 1: QR Verification */}
      {activeTab === "qr" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <QrCode size={20} className="text-blue-600" />
            Scan or Enter Cryptographic QR Payload
          </h2>
          <p className="mt-1 text-xs text-slate-500 mb-6">
            Enter the tamper-proof signed payload from the student's digital mark sheet or APAAR card.
          </p>

          <form onSubmit={handleVerifyQr} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                QR Payload String
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. APAAR:984512347890:DTU:2026:SIGNATURE_HASH"
                value={qrPayload}
                onChange={(e) => setQrPayload(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={verifyingQr}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {verifyingQr ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying with AICTE Registry...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Verify Payload Authenticity
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Manual Consent Verification */}
      {activeTab === "manual" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search size={20} className="text-blue-600" />
            Consent-Gated APAAR Credential Lookup
          </h2>
          <p className="mt-1 text-xs text-slate-500 mb-6">
            Section 6 Digital Personal Data Protection (DPDP) Act verification request.
          </p>

          <form onSubmit={handleVerifyManual} className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                12-Digit Numeric APAAR ID
              </label>
              <input
                type="text"
                required
                maxLength={12}
                placeholder="e.g. 984512347890"
                value={manualForm.apaarId}
                onChange={(e) => setManualForm({ ...manualForm, apaarId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-mono outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Verification Purpose</label>
              <select
                value={manualForm.purpose}
                onChange={(e) => setManualForm({ ...manualForm, purpose: e.target.value as VerificationPurpose })}
                className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-blue-600"
              >
                <option value="EMPLOYMENT">EMPLOYMENT (Pre-Employment Screening)</option>
                <option value="HIGHER_EDUCATION">HIGHER_EDUCATION (University Admissions)</option>
                <option value="SCHOLARSHIP">SCHOLARSHIP (Grant Eligibility)</option>
                <option value="REGULATORY_AUDIT">REGULATORY_AUDIT (Statutory Audit)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                DPDP Explicit Consent Reference ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DPDP-AGENCY-2026-CONSENT-XXXX"
                value={manualForm.consentRef}
                onChange={(e) => setManualForm({ ...manualForm, consentRef: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-[11px] outline-none focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={verifyingManual}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {verifyingManual ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Checking Central AICTE Registry...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Execute Consent-Gated Verification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          <XCircle size={18} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Verified Credential Card Display */}
      {result && (
        <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-white via-emerald-50/20 to-white p-6 md:p-8 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-emerald-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                  SEAL STATUS: {result.sealStatus || "VALID"}
                </span>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{result.studentName}</h3>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">Masked APAAR Identifier</p>
              <p className="font-mono text-base font-bold text-indigo-700">
                {result.maskedApaarId}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-slate-400 font-medium">Institution & AICTE Code</p>
              <p className="mt-1 font-bold text-slate-900">{result.institutionName}</p>
              <p className="font-mono text-[11px] text-slate-500 mt-0.5">{result.aicteCode}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-slate-400 font-medium">Program & Degree</p>
              <p className="mt-1 font-bold text-slate-900">{result.degree}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{result.branch}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-slate-400 font-medium">Enrolment Period</p>
              <p className="mt-1 font-bold text-emerald-700">{result.enrollmentStatus}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Batch {result.admissionYear} - {result.completionYear}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Official Certificate ID</p>
              <p className="font-mono mt-0.5 text-[11px] text-indigo-700 font-bold">
                {result.certificateId}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-700">Verified Timestamp</p>
              <p className="font-mono mt-0.5 text-[11px] text-slate-500">
                {new Date(result.verifiedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: History */}
      {activeTab === "history" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900">Verification Audit History</h3>
              <p className="text-xs text-slate-500">Log of academic verifications conducted by your agency</p>
            </div>
            <button onClick={loadHistory} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              <RefreshCw size={13} className={loadingHistory ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {loadingHistory ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                Loading verification audit history...
              </div>
            ) : history.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="p-3 font-semibold">Timestamp</th>
                    <th className="p-3 font-semibold">APAAR ID</th>
                    <th className="p-3 font-semibold">Method</th>
                    <th className="p-3 font-semibold">Purpose</th>
                    <th className="p-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((tok) => (
                    <tr key={tok.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-500">{new Date(tok.verifiedAt).toLocaleString()}</td>
                      <td className="p-3 font-mono font-bold text-indigo-700">{tok.apaarId}</td>
                      <td className="p-3">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                          {tok.verificationMethod}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{tok.purpose}</td>
                      <td className="p-3 text-right">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {tok.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No verifications conducted yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

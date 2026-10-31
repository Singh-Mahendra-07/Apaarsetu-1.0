"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock,
  FileDown,
  Loader2,
  Map as MapIcon,
  RefreshCw,
  Search,
  SearchCheck,
  ShieldCheck,
  X,
} from "lucide-react";
import OfficerProfileDropdown from "@/components/layout/OfficerProfileDropdown";

/* -------------------------------- Types -------------------------------- */

type InstStatus = "APPROVED" | "UNDER_REVIEW" | "SUSPENDED";
type Category = "ENGINEERING" | "PGDM";
type IntakeStatus = "WITHIN" | "AT_CAPACITY" | "OVER";

type Institution = {
  id: string; // "AICTE-INST-1001"
  name: string;
  affiliation: string;
  city: string;
  zone: string; // NORTH, SOUTH...
  category: Category;
  programs: number;
  approvedSeats: number;
  enrolled: number;
  status: InstStatus;
  violation?: string;
};

type Summary = {
  zone: string;
  total: number;
  approved: number;
  underReview: number;
  suspended: number;
  overIntakeAlerts: number;
  pendingBatch: number;
};

type ProgramRow = {
  code: string;
  degree: string;
  approved: number;
  enrolled: number;
  tfw: number;
  ews: number;
  nri: number;
};

type Dossier = {
  zone: string;
  state: string;
  affiliation: string;
  status: InstStatus;
  validity: string;
  lastSync: string; // ISO
  programs: ProgramRow[];
  flaggedStudents: { name: string; apaarId: string; reason: string }[];
  syncLogs: { at: string; ok: boolean; records: number; message: string }[];
};



const SAMPLE_DOSSIERS: Record<string, Dossier> = {
  "AICTE-INST-1001": {
    zone: "NORTH", state: "Delhi", affiliation: "Delhi Tech University", status: "APPROVED", validity: "2026-2027",
    lastSync: "2026-10-24T12:00:00",
    programs: [
      { code: "CSE-UG-101", degree: "B.Tech Comp Science", approved: 180, enrolled: 175, tfw: 9, ews: 18, nri: 27 },
      { code: "ECE-UG-102", degree: "B.Tech Electronics", approved: 120, enrolled: 118, tfw: 6, ews: 12, nri: 18 },
      { code: "MECH-UG-103", degree: "B.Tech Mechanical", approved: 60, enrolled: 42, tfw: 3, ews: 6, nri: 9 },
      { code: "MBA-PG-201", degree: "Master of Business Adm", approved: 120, enrolled: 120, tfw: 0, ews: 12, nri: 18 },
    ],
    flaggedStudents: [],
    syncLogs: [
      { at: "2026-10-24T12:00:00", ok: true, records: 1840, message: "Nightly ERP sync completed." },
      { at: "2026-10-23T12:00:00", ok: true, records: 1832, message: "Nightly ERP sync completed." },
      { at: "2026-10-22T12:00:04", ok: false, records: 0, message: "ERP endpoint timed out. Retried successfully the next cycle." },
    ],
  },
};

/* -------------------------------- Helpers -------------------------------- */

const PAGE_SIZE = 4;

const intakeStatus = (i: Institution): IntakeStatus =>
  i.enrolled > i.approvedSeats ? "OVER" : i.enrolled === i.approvedSeats && i.approvedSeats > 0 ? "AT_CAPACITY" : "WITHIN";

const pct = (enrolled: number, approved: number) => (approved ? (enrolled / approved) * 100 : 0);

const badgeOf = (i: Institution) => {
  if (i.status === "SUSPENDED") return { label: "SUSPENDED", cls: "bg-red-50 text-red-700 border-red-200" };
  if (intakeStatus(i) === "OVER") return { label: "OVER-CAPACITY", cls: "bg-amber-50 text-amber-800 border-amber-300", warn: true };
  if (i.status === "UNDER_REVIEW") return { label: "UNDER REVIEW", cls: "bg-sky-50 text-sky-800 border-sky-200" };
  return { label: "APPROVED", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" };
};

const formatSync = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} ${time}`;
};

const complianceOf = (p: ProgramRow) =>
  p.enrolled > p.approved
    ? { label: "Over Limit", cls: "text-red-700", dot: "bg-red-500" }
    : p.enrolled === p.approved
      ? { label: "At Capacity", cls: "text-amber-700", dot: "bg-amber-500" }
      : { label: "Within Limit", cls: "text-emerald-700", dot: "" };

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token =
    localStorage.getItem("apaarsetu_access_token") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readError(res: Response) {
  try {
    const j = await res.json();
    return (j.message as string) || (j.error as string) || `Request failed (${res.status}).`;
  } catch {
    return `Request failed (${res.status}).`;
  }
}

const EMPTY_SUMMARY: Summary = {
  zone: "",
  total: 0,
  approved: 0,
  underReview: 0,
  suspended: 0,
  overIntakeAlerts: 0,
  pendingBatch: 0,
};

/* --------------------------------- Page --------------------------------- */

export default function InstitutionDirectoryPage() {
  const [items, setItems] = useState<Institution[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [apiUp, setApiUp] = useState(true);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [statusF, setStatusF] = useState("All");
  const [zoneF, setZoneF] = useState("All");
  const [categoryF, setCategoryF] = useState("All");
  const [intakeF, setIntakeF] = useState("All");
  const [page, setPage] = useState(1);

  const [viewing, setViewing] = useState<Institution | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => setApiUp(r.ok))
      .catch(() => setApiUp(false));

    try {
      const res = await fetch("/api/v1/officer/institutions", {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const raw = (json && typeof json === "object" && "data" in json && json.data) ? json.data : json;
        const instList = Array.isArray(raw?.institutions) ? raw.institutions : (Array.isArray(raw) ? raw : []);
        setItems(instList);
        if (raw?.summary) setSummary(raw.summary);
        setApiUp(true);
      } else if (res.status === 401 || res.status === 403) {
        setApiUp(true);
      }
    } catch {
      // network failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (statusF !== "All" && i.status !== statusF) return false;
      if (zoneF !== "All" && i.zone !== zoneF) return false;
      if (categoryF !== "All" && i.category !== categoryF) return false;
      if (intakeF !== "All" && intakeStatus(i) !== intakeF) return false;
      return !q || [i.id, i.name, i.city, i.affiliation].some((v) => v.toLowerCase().includes(q));
    });
  }, [items, query, statusF, zoneF, categoryF, intakeF]);

  // Back to page 1 whenever the filters change.
  useEffect(() => setPage(1), [query, statusF, zoneF, categoryF, intakeF]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  const exportCsv = () => {
    const head = ["AICTE ID", "Institution", "Affiliation", "City", "Programs", "Approved Seats", "Enrolled", "Status"];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = filtered.map((i) =>
      [i.id, i.name, i.affiliation, i.city, i.programs, i.approvedSeats, i.enrolled, badgeOf(i).label].map(esc).join(",")
    );
    const blob = new Blob([[head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "institution-directory.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ------------------------------ Top bar ------------------------------ */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold">
            APAAR Portal <span className="font-normal text-slate-400">-</span> AICTE Nodal Officer Console
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${apiUp ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            <span className={`h-2 w-2 rounded-full ${apiUp ? "bg-emerald-500" : "bg-red-500"}`} />
            {apiUp ? "API Connected (Port 8081)" : "API Unreachable (Port 8081)"}
          </span>
          <OfficerProfileDropdown />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          Regulatory Compliance Division {summary.zone ? `- ${summary.zone} Zone` : ""}
        </h1>

        {/* ----------------------------- Stat cards ----------------------------- */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat title="Total Institutions" icon={<MapIcon className="h-7 w-7 text-indigo-500" />}>
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{summary.total}</span>
              <span className="text-sm text-slate-600">
                Active across {summary.zone ? `${summary.zone[0]}${summary.zone.slice(1).toLowerCase()} Zone` : "Assigned Zone"}
              </span>
            </p>
          </Stat>
          <Stat title="Regulatory Status">
            <div className="flex items-center gap-3">
              <p>
                <span className="text-3xl font-bold text-emerald-600">{summary.approved}</span>{" "}
                <span className="text-sm text-slate-600">Approved</span>
              </p>
              <div className="border-l border-slate-300 pl-3 text-sm">
                <p className="text-amber-700">{summary.underReview} Under Review</p>
                <p className="text-red-700">{summary.suspended} Suspended</p>
              </div>
            </div>
          </Stat>
          <Stat title="Intake Capacity Alerts">
            <p className="flex items-center gap-2">
              <span className="text-3xl font-bold text-red-600">{summary.overIntakeAlerts}</span>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">Over-Intake Violations</span>
            </p>
          </Stat>
          <Stat title="Pending Batch Verifications">
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{summary.pendingBatch}</span>
              <span className="text-sm text-slate-600">Institutions awaiting sign-off</span>
            </p>
          </Stat>
        </section>

        {/* ------------------------------ Directory ------------------------------ */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by AICTE ID, College Name, City, or Affiliation..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <button onClick={exportCsv} className="text-sm font-medium text-indigo-700 hover:underline">
              Export Directory CSV
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <FilterSelect label="Status" value={statusF} onChange={setStatusF} options={[["All", "All"], ["APPROVED", "Approved"], ["UNDER_REVIEW", "Under Review"], ["SUSPENDED", "Suspended"]]} />
            <FilterSelect label="Zone" value={zoneF} onChange={setZoneF} options={[["All", "All"], ["NORTH", "North"], ["SOUTH", "South"], ["WEST", "West"], ["EAST", "East"], ["CENTRAL", "Central"]]} />
            <FilterSelect label="Category" value={categoryF} onChange={setCategoryF} options={[["All", "All"], ["ENGINEERING", "Engineering"], ["PGDM", "PGDM"]]} />
            <FilterSelect label="Intake Status" value={intakeF} onChange={setIntakeF} options={[["All", "All"], ["WITHIN", "Within Limit"], ["AT_CAPACITY", "At Capacity"], ["OVER", "Over Capacity"]]} />
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 font-semibold">
                <tr>
                  <th className="px-4 py-3">Institution ID</th>
                  <th className="px-4 py-3">Institution Name</th>
                  <th className="px-4 py-3">Programs</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Badge</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      No institutions match these filters. Clear the search or change a filter.
                    </td>
                  </tr>
                )}
                {rows.map((i) => {
                  const percent = pct(i.enrolled, i.approvedSeats);
                  const over = i.enrolled > i.approvedSeats;
                  const badge = badgeOf(i);
                  return (
                    <tr key={i.id} className="border-t border-slate-200 align-top">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-indigo-700">{i.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{i.name}</p>
                        <p className="text-xs text-slate-600">Affiliated to {i.affiliation}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{i.programs} Programs</td>
                      <td className="min-w-[220px] px-4 py-3">
                        <p className="text-sm">
                          {i.enrolled} / {i.approvedSeats} seats{" "}
                          <span className={over ? "font-semibold text-red-600" : "text-slate-600"}>({percent.toFixed(percent % 1 ? 1 : 0)}%)</span>
                        </p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200">
                          <div
                            className={`h-1.5 rounded-full ${over ? "bg-red-500" : "bg-indigo-500"}`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        {i.violation && <p className="mt-1.5 text-xs text-red-600">*Violation: {i.violation}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold ${badge.cls}`}>
                          {badge.warn && <AlertTriangle className="h-3.5 w-3.5" />}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setViewing(i)}
                          className="whitespace-nowrap rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
            <p>
              {filtered.length === 0
                ? "Showing 0 institutions"
                : `Showing ${start + 1} - ${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} institutions`}
            </p>
            {pages > 1 && (
              <nav aria-label="Pagination" className="flex items-center gap-1">
                <button
                  onClick={() => setPage(current - 1)}
                  disabled={current === 1}
                  className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-40"
                >
                  &lt; Previous
                </button>
                {Array.from({ length: pages }, (_, n) => n + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    aria-current={n === current ? "page" : undefined}
                    className={`h-7 min-w-7 rounded px-2 ${n === current ? "bg-indigo-600 font-semibold text-white" : "hover:bg-slate-100"}`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(current + 1)}
                  disabled={current === pages}
                  className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-40"
                >
                  Next &gt;
                </button>
              </nav>
            )}
          </div>
        </section>
      </main>

      {viewing && <DossierModal inst={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

/* ------------------------------ Dossier modal ------------------------------ */

type DossierTab = "matrix" | "super" | "flagged" | "sync";

function DossierModal({ inst, onClose }: { inst: Institution; onClose: () => void }) {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [sample, setSample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DossierTab>("matrix");
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiry, setInquiry] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/officer/institutions/${inst.id}/dossier`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          const raw = (json && typeof json === "object" && "data" in json && json.data) ? json.data : json;
          const normalized: Dossier = {
            zone: raw?.zone || inst.zone || "NORTH",
            state: raw?.state || "N/A",
            affiliation: raw?.affiliation || inst.affiliation || "N/A",
            status: raw?.status || inst.status || "APPROVED",
            validity: raw?.validity || "2026-2027",
            lastSync: raw?.lastSync || new Date().toISOString(),
            programs: Array.isArray(raw?.programs) ? raw.programs : [],
            flaggedStudents: Array.isArray(raw?.flaggedStudents) ? raw.flaggedStudents : [],
            syncLogs: Array.isArray(raw?.syncLogs) ? raw.syncLogs : [],
          };
          if (!cancelled) setDossier(normalized);
          return;
        }
        if (res.status === 401 || res.status === 403) {
          if (SAMPLE_DOSSIERS[inst.id]) {
            if (!cancelled) {
              setDossier(SAMPLE_DOSSIERS[inst.id]);
              setSample(true);
            }
          } else if (!cancelled) {
            setError("Authentication required or session expired. Sign in as an AICTE Officer to view this live dossier.");
          }
          return;
        }
        throw new Error(String(res.status));
      } catch {
        if (cancelled) return;
        if (SAMPLE_DOSSIERS[inst.id]) {
          const s = SAMPLE_DOSSIERS[inst.id];
          setDossier({
            ...s,
            programs: Array.isArray(s.programs) ? s.programs : [],
            flaggedStudents: Array.isArray(s.flaggedStudents) ? s.flaggedStudents : [],
            syncLogs: Array.isArray(s.syncLogs) ? s.syncLogs : [],
          });
          setSample(true);
        } else {
          setError("The compliance dossier could not be loaded. Please ensure you are logged in with officer credentials.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inst.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inquiry.trim().length < 10) {
      setNotice({ ok: false, text: "Write at least 10 characters so the institution knows what to respond to." });
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/v1/officer/institutions/${inst.id}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ message: inquiry.trim() }),
      });
      if (!res.ok) throw new Error(await readError(res));
      setNotice({ ok: true, text: "Compliance inquiry sent to the institution." });
      setInquiry("");
      setInquiryOpen(false);
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : "Could not send the inquiry." });
    } finally {
      setSending(false);
    }
  };

  const tabs: { key: DossierTab; label: string; extra?: React.ReactNode }[] = [
    { key: "matrix", label: "Program Intake Matrix" },
    { key: "super", label: "Supernumerary Breakdown" },
    {
      key: "flagged",
      label: `Flagged Students (${dossier?.flaggedStudents?.length ?? 0})`,
      extra: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    },
    { key: "sync", label: "ERP Sync Logs" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dossier-title"
        onClick={(e) => e.stopPropagation()}
        className="my-4 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between bg-indigo-700 px-6 py-4 text-white">
          <h3 id="dossier-title" className="text-lg font-bold leading-snug">
            <span className="uppercase">Institution Compliance Dossier</span>
            <span className="font-normal"> : {inst.name} ({inst.id})</span>
          </h3>
          <button aria-label="Close" onClick={onClose} className="rounded p-1 text-indigo-100 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 text-sm">
          {loading && (
            <p className="flex items-center gap-2 py-10 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading compliance dossier...
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {error}
            </p>
          )}

          {dossier && (
            <>
              {sample && (
                <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  The API is unreachable, so this dossier is showing sample data.
                </p>
              )}

              <p className="text-slate-800">
                Zone: {dossier.zone} / {dossier.state} <span className="text-slate-400">|</span> Affiliation: {dossier.affiliation}{" "}
                <span className="text-slate-400">|</span> Status:{" "}
                <span className={`font-semibold ${dossier.status === "APPROVED" ? "text-emerald-700" : dossier.status === "SUSPENDED" ? "text-red-700" : "text-amber-700"}`}>
                  {dossier.status.replace("_", " ")}
                </span>{" "}
                (Valid {dossier.validity})
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-slate-600">
                Last Sync: {formatSync(dossier.lastSync)} <Clock className="h-4 w-4" />
              </p>

              {/* Tabs */}
              <div role="tablist" className="mt-4 flex flex-wrap gap-x-5 border-b border-slate-200">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={`-mb-px flex items-center gap-1.5 border-b-2 px-1 pb-2 ${tab === t.key ? "border-indigo-600 font-semibold text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    {t.extra}
                    {t.label}
                  </button>
                ))}
              </div>

              <div role="tabpanel" className="mt-4">
                {tab === "matrix" && (
                  <DataTable
                    head={["Program Code", "Degree & Branch", "Approved", "Enrolled", "Supernumerary (TFW/EWS/NRI)", "Compliance"]}
                    empty="No programs recorded."
                    rows={(dossier.programs ?? []).map((p) => {
                      const c = complianceOf(p);
                      return [
                        <b key="c">{p.code}</b>,
                        p.degree,
                        p.approved,
                        p.enrolled,
                        `TFW: ${p.tfw}, EWS: ${p.ews}, NRI: ${p.nri}`,
                        <span key="s" className={`inline-flex items-center gap-1.5 font-medium ${c.cls}`}>
                          {c.dot ? <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} /> : <Check className="h-4 w-4" />}
                          {c.label}
                        </span>,
                      ];
                    })}
                  />
                )}

                {tab === "super" && (
                  <DataTable
                    head={["Program Code", "TFW", "EWS", "NRI", "Total", "% of Approved"]}
                    empty="No programs recorded."
                    rows={(dossier.programs ?? []).map((p) => {
                      const total = (p.tfw || 0) + (p.ews || 0) + (p.nri || 0);
                      return [<b key="c">{p.code}</b>, p.tfw, p.ews, p.nri, <b key="t">{total}</b>, `${pct(total, p.approved).toFixed(1)}%`];
                    })}
                  />
                )}

                {tab === "flagged" &&
                  ((dossier.flaggedStudents ?? []).length === 0 ? (
                    <p className="rounded-lg bg-slate-50 py-8 text-center text-slate-600">No flagged students for this institution.</p>
                  ) : (
                    <DataTable
                      head={["Student", "APAAR ID", "Reason"]}
                      empty=""
                      rows={(dossier.flaggedStudents ?? []).map((s) => [s.name, <span key="a" className="font-mono text-xs">{s.apaarId}</span>, s.reason])}
                    />
                  ))}

                {tab === "sync" && (
                  <DataTable
                    head={["Synced At", "Result", "Records", "Message"]}
                    empty="No sync runs recorded."
                    rows={(dossier.syncLogs ?? []).map((l) => [
                      formatSync(l.at),
                      <span key="r" className={`font-semibold ${l.ok ? "text-emerald-700" : "text-red-700"}`}>{l.ok ? "SUCCESS" : "FAILED"}</span>,
                      (l.records ?? 0).toLocaleString("en-IN"),
                      l.message,
                    ])}
                  />
                )}
              </div>

              {/* Regulatory actions */}
              <div className="-mx-6 mt-5 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <p className="mb-3 font-bold uppercase text-slate-700">Regulatory Actions</p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`/api/v1/officer/institutions/${inst.id}/sanction-letter`}
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium hover:bg-slate-100"
                  >
                    <FileDown className="h-4 w-4" /> Download Sanction Letter PDF
                  </a>
                  <Link
                    href={`/aicte-officer/institutions/${inst.id}/enrollment`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium hover:bg-slate-100"
                  >
                    <SearchCheck className="h-4 w-4" /> Audit Student Enrollment List
                  </Link>
                  <button
                    onClick={() => setInquiryOpen((o) => !o)}
                    aria-expanded={inquiryOpen}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700"
                  >
                    <AlertTriangle className="h-4 w-4" /> Issue Compliance Inquiry
                  </button>
                </div>

                {inquiryOpen && (
                  <form onSubmit={sendInquiry} className="mt-3 space-y-2">
                    <label className="block">
                      <span className="mb-1 block font-medium text-slate-700">Inquiry to {inst.name}</span>
                      <textarea
                        value={inquiry}
                        onChange={(e) => setInquiry(e.target.value)}
                        rows={3}
                        placeholder="Describe what the institution must explain or correct."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setInquiryOpen(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium hover:bg-slate-100">
                        Cancel
                      </button>
                      <button type="submit" disabled={sending} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                        {sending && <Loader2 className="h-4 w-4 animate-spin" />} Send inquiry
                      </button>
                    </div>
                  </form>
                )}

                {notice && (
                  <p role="status" className={`mt-3 ${notice.ok ? "text-emerald-700" : "text-red-600"}`}>
                    {notice.text}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Small pieces ------------------------------ */

function DataTable({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[560px] text-left">
        <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-700">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={head.length} className="px-3 py-6 text-center text-slate-500">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-200">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2.5">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-600">{title}</p>
        {icon}
      </div>
      {children}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex items-center gap-2 text-slate-700">
      {label}:
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none rounded-md border border-slate-300 bg-white py-1 pl-2.5 pr-7 text-sm outline-none focus:border-indigo-500"
        >
          {options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </span>
    </label>
  );
}

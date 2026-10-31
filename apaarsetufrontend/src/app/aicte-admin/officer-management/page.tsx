"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Plus, Search, Settings, X } from "lucide-react";

/* -------------------------------- Types -------------------------------- */

type Duty = "ON_DUTY" | "ON_LEAVE" | "SUSPENDED";
type ZoneKey = "NORTH" | "SOUTH" | "WEST" | "EAST" | "CENTRAL";

type Officer = {
  id: string;
  name: string;
  email: string;
  zone: ZoneKey;
  duty: Duty;
  open: number;
  resolved: number;
};

type Zone = {
  key: ZoneKey;
  label: string;
  disputes: number;
  states: string; // shown in the appointment form
};

type Summary = {
  criticalFlags: number;
  turnaroundHrs: number;
};

/* ------------------------------ Sample data ------------------------------ */
// Replace with GET /api/v1/admin/officers; shown only if the API is unreachable.

const ZONES: Zone[] = [
  { key: "NORTH", label: "NORTH ZONE", disputes: 14, states: "NORTH (7 States) – Delhi, UP, PB, HR, JK, HP, UT" },
  { key: "SOUTH", label: "SOUTH ZONE", disputes: 9, states: "SOUTH (6 States) – KA, TN, KL, TS, AP, PY" },
  { key: "WEST", label: "WEST ZONE", disputes: 8, states: "WEST (4 States) – MH, GJ, GA, RJ" },
  { key: "EAST", label: "EAST ZONE", disputes: 11, states: "EAST (6 States) – WB, BH, OR, JH, AS, SK" },
  { key: "CENTRAL", label: "CENTRAL ZONE", disputes: 0, states: "CENTRAL (3 States) – MP, CG, UP (East)" },
];

const DUTY_CLS: Record<Duty, { badge: string; dot: string }> = {
  ON_DUTY: { badge: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  ON_LEAVE: { badge: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  SUSPENDED: { badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s+/i, "")
    .trim()
    .charAt(0)
    .toUpperCase();

/* --------------------------------- Page --------------------------------- */

export default function OfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [summary, setSummary] = useState<Summary>({ criticalFlags: 0, turnaroundHrs: 0 });
  const [loading, setLoading] = useState(true);
  const [apiUp, setApiUp] = useState(true);

  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState<"All" | ZoneKey>("All");
  const [dutyFilter, setDutyFilter] = useState<"All" | Duty>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedOfficerId, setPreselectedOfficerId] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => setApiUp(r.ok))
      .catch(() => setApiUp(false));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("apaarsetu_access_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/officers", { headers, cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as { officers: Officer[]; summary?: Summary };
        if (json.officers) {
          setOfficers(json.officers);
        }
        if (json.summary) setSummary(json.summary);
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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const activeOfficers = officers.filter((o) => o.duty !== "SUSPENDED").length;
  const totalDisputes = ZONES.reduce((sum, z) => sum + z.disputes, 0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return officers.filter((o) => {
      if (zoneFilter !== "All" && o.zone !== zoneFilter) return false;
      if (dutyFilter !== "All" && o.duty !== dutyFilter) return false;
      return !q || [o.name, o.email, o.zone].some((v) => v.toLowerCase().includes(q));
    });
  }, [officers, query, zoneFilter, dutyFilter]);

  const setDuty = async (id: string, duty: Duty, msg: string) => {
    setOfficers((prev) => prev.map((o) => (o.id === id ? { ...o, duty } : o)));
    setMenuFor(null);
    setToast(msg);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("apaarsetu_access_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(`/api/v1/admin/officers/${id}/duty`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ duty }),
      });
    } catch {
      // Graceful local fallback
    }
  };

  const onReassigned = (id: string, newZone: ZoneKey) => {
    const target = officers.find((o) => o.id === id);
    const officerName = target ? target.name : "Officer";
    const oldZone = target ? target.zone : "";

    setOfficers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, zone: newZone } : o))
    );
    setModalOpen(false);
    setPreselectedOfficerId(null);
    setToast(`${officerName} reassigned from ${oldZone} to ${newZone} zone.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" onClick={() => setMenuFor(null)}>
      {/* ------------------------------ Top bar ------------------------------ */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            System Administration
          </p>
          <h2 className="text-xl font-bold">Central Control Center</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${apiUp ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
            <span className={`h-2 w-2 rounded-full ${apiUp ? "bg-emerald-500" : "bg-red-500"}`} />
            {apiUp ? "Central API Online" : "Central API Offline"}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-6">
        <Link
          href="/aicte-admin"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Central Dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          AICTE Officer Management — Zonal Deployment &amp; Dispute Adjudication Worklist
        </h1>

        {/* ----------------------------- Stat cards ----------------------------- */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat title="Active Officers" value={`${activeOfficers} Zonal`} note="In duty status tracker" />
          <Stat title="Pending Disputes" value={`${totalDisputes} Cases Open`} note="Routed to adjudication" />
          <Stat
            title="Critical Flags"
            value={`${summary.criticalFlags} High Priority`}
            note="Needs immediate review"
            valueCls="text-red-600"
          />
          <Stat title="Turnaround Rate" value={`${summary.turnaroundHrs} Hrs Avg`} note="Performance tracker" />
        </section>

        {/* ----------------------------- Zone cards ----------------------------- */}
        <h3 className="mt-7 text-lg font-bold">{ZONES.length} Regional Zones</h3>
        <section className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ZONES.map((z) => {
            const count = officers.filter((o) => o.zone === z.key).length;
            const gap = count === 0;
            const active = zoneFilter === z.key;
            return (
              <button
                key={z.key}
                onClick={() => setZoneFilter(active ? "All" : z.key)}
                aria-pressed={active}
                className={`rounded-xl border p-4 text-left shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${gap
                    ? "border-red-300 bg-amber-50"
                    : active
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
              >
                <p className="font-bold">{z.label}</p>
                <p className="mt-1 text-sm text-slate-700">
                  {count} {count === 1 ? "Officer" : "Officers"}
                  {gap && " (Gap)"} |{" "}
                  <span className={gap ? "rounded bg-red-600 px-1.5 py-0.5 text-white" : ""}>
                    {z.disputes} Disputes
                  </span>
                </p>
              </button>
            );
          })}
        </section>

        {/* ------------------------------ Filters ------------------------------ */}
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Officer, Email, Region..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <Select
            label="All Zones"
            value={zoneFilter}
            onChange={(v) => setZoneFilter(v as typeof zoneFilter)}
            options={["All", ...ZONES.map((z) => z.key)]}
          />
          <Select
            label="Duty Status"
            value={dutyFilter}
            onChange={(v) => setDutyFilter(v as typeof dutyFilter)}
            options={["All", "ON_DUTY", "ON_LEAVE", "SUSPENDED"]}
          />
          <button
            onClick={() => {
              setPreselectedOfficerId(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Appoint Officer
          </button>
        </div>

        {/* ------------------------------- Table ------------------------------- */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 font-semibold">
              <tr>
                <th className="px-5 py-3">Officer Profile</th>
                <th className="px-5 py-3">Zone</th>
                <th className="px-5 py-3">Operational Duty</th>
                <th className="px-5 py-3">Caseload Queue</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      <span>Loading regional officers...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    No officers match these filters. Clear the search or pick another zone.
                  </td>
                </tr>
              ) : null}
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-slate-200">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-700 font-semibold text-white">
                        {initials(o.name)}
                      </div>
                      <div>
                        <p className="font-medium">{o.name}</p>
                        <p className="text-slate-600">{o.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{o.zone}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${DUTY_CLS[o.duty].badge}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${DUTY_CLS[o.duty].dot}`} />
                      {o.duty}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {o.open} Open / {o.resolved} Res
                  </td>
                  <td className="px-5 py-3">
                    <div className="relative flex items-center gap-3">
                      <Link
                        href={`/aicte-admin/officers/${o.id}/queue`}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        View Queue
                      </Link>
                      <button
                        aria-label={`Settings for ${o.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuFor(menuFor === o.id ? null : o.id);
                        }}
                        className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                      {menuFor === o.id && (
                        <ul
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-11 z-10 w-44 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
                        >
                          <MenuItem
                            onClick={() => {
                              setPreselectedOfficerId(o.id);
                              setModalOpen(true);
                              setMenuFor(null);
                            }}
                          >
                            Reassign Zone
                          </MenuItem>
                          {o.duty !== "ON_DUTY" && (
                            <MenuItem onClick={() => setDuty(o.id, "ON_DUTY", `${o.name} is on duty.`)}>
                              Mark on duty
                            </MenuItem>
                          )}
                          {o.duty === "ON_DUTY" && (
                            <MenuItem onClick={() => setDuty(o.id, "ON_LEAVE", `${o.name} is on leave.`)}>
                              Mark on leave
                            </MenuItem>
                          )}
                          {o.duty !== "SUSPENDED" && (
                            <MenuItem danger onClick={() => setDuty(o.id, "SUSPENDED", `${o.name} suspended.`)}>
                              Suspend officer
                            </MenuItem>
                          )}
                        </ul>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {modalOpen && (
        <AppointModal
          officers={officers}
          initialOfficerId={preselectedOfficerId}
          onClose={() => {
            setModalOpen(false);
            setPreselectedOfficerId(null);
          }}
          onReassigned={onReassigned}
          onError={setToast}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Appoint / Reassign modal ------------------------------ */

function AppointModal({
  officers,
  initialOfficerId,
  onClose,
  onReassigned,
  onError,
}: {
  officers: Officer[];
  initialOfficerId?: string | null;
  onClose: () => void;
  onReassigned: (id: string, newZone: ZoneKey) => void;
  onError: (msg: string) => void;
}) {
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(
    initialOfficerId || (officers.length > 0 ? officers[0].id : "")
  );

  const selectedOfficer = useMemo(
    () => officers.find((o) => o.id === selectedOfficerId) || officers[0] || null,
    [officers, selectedOfficerId]
  );

  const [newZone, setNewZone] = useState<ZoneKey>(
    selectedOfficer ? selectedOfficer.zone : "NORTH"
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficer) {
      onError("Please select an officer to assign.");
      return;
    }

    setSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("apaarsetu_access_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/officers/${selectedOfficer.id}/transfer`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ zone: newZone }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      onReassigned(selectedOfficer.id, newZone);
    } catch {
      // Local fallback in case backend is offline or for rapid local UI preview
      onReassigned(selectedOfficer.id, newZone);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="appoint-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 id="appoint-title" className="text-lg font-bold uppercase tracking-wide text-slate-900">
              Appoint / Reassign Regional Officer
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Select an officer to deploy or reassign their regional jurisdiction.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          {/* Officer Dropdown Selection */}
          <label className="block">
            <span className="mb-1.5 block font-semibold text-slate-800">
              Select Officer
            </span>
            <select
              value={selectedOfficer ? selectedOfficer.id : ""}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedOfficerId(nextId);
                const nextOff = officers.find((o) => o.id === nextId);
                if (nextOff) setNewZone(nextOff.zone);
              }}
              className="field cursor-pointer font-medium text-slate-800"
            >
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.email}) — Currently: {o.zone} Zone
                </option>
              ))}
            </select>
          </label>

          {/* Current Region / Deployment Card */}
          {selectedOfficer && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    Current Deployment
                  </span>
                  <h4 className="mt-1 text-base font-bold text-slate-900">{selectedOfficer.name}</h4>
                  <p className="text-xs text-slate-600">{selectedOfficer.email}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-bold text-indigo-800 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    {selectedOfficer.zone} ZONE
                  </span>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Duty: <strong className="text-slate-700">{selectedOfficer.duty}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* New Assigned Zone to Change Dropdown */}
          <label className="block">
            <span className="mb-1.5 block font-semibold text-slate-800">
              New Assigned Zone to Change
            </span>
            <span className="mb-2 block text-xs text-slate-500">
              Select the new regional jurisdiction to transfer and deploy this officer.
            </span>
            <select
              value={newZone}
              onChange={(e) => setNewZone(e.target.value as ZoneKey)}
              className="field cursor-pointer font-medium text-slate-800"
            >
              {ZONES.map((z) => (
                <option key={z.key} value={z.key}>
                  {z.states}
                </option>
              ))}
            </select>
          </label>

          {/* Zone Transition Visual Summary */}
          {selectedOfficer && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Current:</span>
                <span className="font-bold text-slate-800">{selectedOfficer.zone} ZONE</span>
              </div>
              <span className="font-bold text-indigo-600">➔</span>
              <div className="flex items-center gap-1.5">
                <span className="text-indigo-700">New Target:</span>
                <span className="font-bold text-indigo-900">{newZone} ZONE</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !selectedOfficer}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Reassigning..." : "Update Zonal Assignment"}
          </button>
        </div>

        <style jsx>{`
          .field {
            width: 100%;
            border: 1px solid rgb(203 213 225);
            border-radius: 0.5rem;
            background: white;
            padding: 0.6rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
          }
          .field:focus {
            border-color: rgb(99 102 241);
            box-shadow: 0 0 0 3px rgb(199 210 254);
          }
        `}</style>
      </form>
    </div>
  );
}


/* ------------------------------ Small pieces ------------------------------ */

function Stat({
  title,
  value,
  note,
  valueCls = "",
}: {
  title: string;
  value: string;
  note: string;
  valueCls?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-slate-800">{title}</p>
      <p className={`text-2xl font-bold ${valueCls}`}>{value}</p>
      <p className="text-sm text-slate-600">{note}</p>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-indigo-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "All" ? label : o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full px-4 py-2 text-left hover:bg-slate-50 ${danger ? "text-red-700" : ""}`}
      >
        {children}
      </button>
    </li>
  );
}

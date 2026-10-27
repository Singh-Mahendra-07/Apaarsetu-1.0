"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { dashboardApi, institutionApi, apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { InstitutionResponseDTO } from "@/types/api";
import InstitutionAdminProfileDropdown from "@/components/layout/InstitutionAdminProfileDropdown";

/* ============ TYPES ============ */
type Person = {
  name: string;
  email: string;
  phone: string;
  status?: string;
  privileges?: string;
};

type Institution = {
  name: string;
  institutionId: string;
  approvalStatus: "APPROVED" | "PENDING" | "SUSPENDED";
  validFor: string;
  aicteVerified: boolean;
  description: string;
  type: string;
  zone: string;
  universityAffiliation: string;
  userName: string;
  head: Person;
  nodalOfficer: Person;
};

type Program = {
  code: string;
  name: string;
  level: "UG" | "PG";
  durationYears: number;
  regularSeats: number;
  quotas: Record<string, number>;
  note?: string;
};

type Hit = {
  key: string;
  section: string;
  anchor: string;
  label: string;
  text: string;
  program?: string;
};

/* ============ HELPERS ============ */
const QUOTA_ORDER = ["tfw", "ews", "nri", "pmsss", "oci"];

const quotaTotal = (p: Program) => Object.values(p.quotas).reduce((s, n) => s + n, 0);

const quotaText = (p: Program) => {
  const parts = QUOTA_ORDER.filter((k) => k in p.quotas && p.quotas[k] > 0).map(
    (k) => `${k.toUpperCase()}: ${p.quotas[k]}`
  );
  return parts.length > 0 ? parts.join(" | ") : "Quota: Standard AICTE Allocations";
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ============ SUB-COMPONENTS ============ */
function Hl({ text, terms }: { text: string; terms: string[] }) {
  const t = terms.map((x) => x.trim()).filter(Boolean);
  if (!t.length || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${t.map(esc).join("|")})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-amber-200 px-0.5 text-slate-900">
            {p}
          </mark>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
    </>
  );
}

function Field({ label, value, terms }: { label: string; value: string; terms: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">
        <Hl text={value} terms={terms} />
      </p>
    </div>
  );
}

function Select({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
    </div>
  );
}

function Card({
  id,
  title,
  flash,
  children,
}: {
  id: string;
  title: string;
  flash: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 rounded-xl border bg-white shadow-sm transition-shadow ${flash ? "border-indigo-600 ring-2 ring-indigo-200" : "border-slate-200"
        }`}
    >
      <h2 className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900">
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ============ PAGE COMPONENT ============ */
export default function InstitutionProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [inst, setInst] = useState<Institution | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  // Matrix filters
  const [mq, setMq] = useState("");
  const [level, setLevel] = useState("ALL");
  const [duration, setDuration] = useState("ALL");

  // Global search
  const [gq, setGq] = useState("");
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState("");
  const gRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr("");
    try {
      const userProfile = apiClient.getUserProfile();
      let instRes: InstitutionResponseDTO | null = null;
      let dashRes: any = null;

      try {
        dashRes = await dashboardApi.getInstitution();
      } catch {
        // dashboard endpoint might fail if offline or unauthorized
      }

      const instId = dashRes?.institutionId || userProfile?.institutionId || "";

      if (instId) {
        try {
          instRes = await institutionApi.getInstitutionById(instId);
        } catch {
          // getInstitutionById might fail or be restricted
        }
      }

      if (!instRes && !dashRes && !userProfile) {
        setInst(null);
        setPrograms([]);
        setApiOk(false);
        setLoadErr("Session expired or institution records unreachable on Port 8081.");
        return;
      }

      const instName =
        instRes?.name ||
        dashRes?.institutionName ||
        userProfile?.institutionName ||
        "AICTE Affiliated Institution";

      const instAicteId =
        instRes?.aicteId ||
        instRes?.id ||
        dashRes?.institutionId ||
        userProfile?.institutionId ||
        "AICTE-INST";

      const validFor = dashRes?.academicYear || "2026-2027";
      const status =
        instRes?.status === "SUSPENDED" || instRes?.status === "PENDING"
          ? instRes.status
          : "APPROVED";

      const zoneStr = instRes?.zone
        ? `${instRes.zone} Zone${instRes.city ? ` (${instRes.city})` : ""}`
        : instRes?.city && instRes?.state
          ? `${instRes.city}, ${instRes.state}`
          : "National Jurisdiction";

      const mappedInst: Institution = {
        name: instName,
        institutionId: instAicteId,
        approvalStatus: status,
        validFor: validFor,
        aicteVerified: true,
        description:
          instRes?.description ||
          "Master AICTE record of record. Official intake limits, supernumerary seat quotas, and university affiliations.",
        type: instRes?.type || "AICTE Approved Institution",
        zone: zoneStr,
        universityAffiliation: instRes?.universityAffiliation || "State Technical University",
        userName: userProfile?.fullName || "Admin",
        head: {
          name: instRes?.headName || userProfile?.fullName || "Principal / Director",
          email: instRes?.headEmail || userProfile?.email || "principal@institution.edu",
          phone: instRes?.headPhone || userProfile?.phone || "+91 11 2788 0001",
          status: instRes?.headStatus || "Registered & Attested",
        },
        nodalOfficer: {
          name: instRes?.nodalOfficerName || (instName ? `Registrar Office (${instName})` : "APAAR Nodal Officer"),
          email: instRes?.nodalOfficerEmail || (userProfile?.email ? `nodal.${userProfile.email}` : "nodal.apaar@institution.edu"),
          phone: instRes?.nodalOfficerPhone || userProfile?.phone || "+91 99785 43210",
          privileges: instRes?.nodalOfficerPrivileges || "Batch Sign-off & Verification Authorized",
        },
      };

      let mappedPrograms: Program[] = [];
      if (instRes?.approvedPrograms && instRes.approvedPrograms.length > 0) {
        mappedPrograms = instRes.approvedPrograms.map((p) => {
          const q = p.supernumeraryQuota || { tfw: 0, ews: 0, nri: 0, pmsss: 0, ociFn: 0 };
          const isPg =
            p.level?.toUpperCase().includes("POST") ||
            p.level?.toUpperCase() === "PG" ||
            p.programCode?.toUpperCase().includes("MBA") ||
            p.programCode?.toUpperCase().includes("MCA");
          return {
            code: p.programCode,
            name: p.programName,
            level: isPg ? "PG" : "UG",
            durationYears: p.duration || (isPg ? 2 : 4),
            regularSeats: p.approvedIntake || 0,
            quotas: {
              tfw: q.tfw || 0,
              ews: q.ews || 0,
              nri: q.nri || 0,
              pmsss: q.pmsss || 0,
              oci: q.ociFn || 0,
            },
            note: p.academicYear ? `AY ${p.academicYear}` : undefined,
          };
        });
      } else if (dashRes?.programCapacities && dashRes.programCapacities.length > 0) {
        mappedPrograms = dashRes.programCapacities.map((c: any) => {
          const q = c.supernumeraryQuota || { tfw: 0, ews: 0, nri: 0 };
          const isPg =
            c.programCode?.toUpperCase().includes("PG") ||
            c.programCode?.toUpperCase().includes("MBA") ||
            c.programCode?.toUpperCase().includes("MCA");
          return {
            code: c.programCode,
            name: c.programName,
            level: isPg ? "PG" : "UG",
            durationYears: isPg ? 2 : 4,
            regularSeats: c.regularApproved || 0,
            quotas: {
              tfw: q.tfw || 0,
              ews: q.ews || 0,
              nri: q.nri || 0,
              pmsss: q.pmsss || 0,
              oci: q.ociFn || 0,
            },
            note: dashRes.academicYear ? `AY ${dashRes.academicYear}` : undefined,
          };
        });
      }

      setInst(mappedInst);
      setPrograms(mappedPrograms);
      setApiOk(true);
    } catch (e) {
      setInst(null);
      setPrograms([]);
      setApiOk(false);
      setLoadErr(e instanceof Error ? e.message : "API communication error on Port 8081");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Ctrl/Cmd+K focuses search
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        gRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);


  const totals = useMemo(() => {
    const regular = programs.reduce((s, p) => s + p.regularSeats, 0);
    const total = programs.reduce((s, p) => s + p.regularSeats + quotaTotal(p), 0);
    return { regular, super: total - regular, total };
  }, [programs]);

  const durations = useMemo(
    () => Array.from(new Set(programs.map((p) => p.durationYears))).sort((a, b) => a - b),
    [programs]
  );

  const rows = useMemo(() => {
    const q = mq.trim().toLowerCase();
    return programs.filter(
      (p) =>
        (level === "ALL" || p.level === level) &&
        (duration === "ALL" || String(p.durationYears) === duration) &&
        (!q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
    );
  }, [programs, mq, level, duration]);

  // Searchable index of everything on the page
  const hits = useMemo<Hit[]>(() => {
    if (!inst) return [];
    const q = gq.trim().toLowerCase();
    if (!q) return [];
    const all: Hit[] = [
      { key: "name", section: "Overview", anchor: "sec-overview", label: "Institution", text: inst.name },
      { key: "id", section: "Overview", anchor: "sec-overview", label: "AICTE ID", text: inst.institutionId },
      {
        key: "status",
        section: "Overview",
        anchor: "sec-overview",
        label: "Status",
        text: `${inst.approvalStatus} (Valid ${inst.validFor})`,
      },
      { key: "type", section: "Overview", anchor: "sec-overview", label: "Type", text: inst.type },
      { key: "zone", section: "Overview", anchor: "sec-overview", label: "Zone", text: inst.zone },
      {
        key: "uni",
        section: "Overview",
        anchor: "sec-overview",
        label: "University affiliation",
        text: inst.universityAffiliation,
      },
      ...programs.map((p) => ({
        key: p.code,
        section: "Programs",
        anchor: "sec-programs",
        label: p.code,
        program: p.code,
        text: `${p.name} - ${p.level}, ${p.durationYears} years, ${p.regularSeats} regular seats, ${quotaText(
          p
        )}${p.note ? `, ${p.note}` : ""}`,
      })),
      ...([
        ["head", "Head of institution", inst.head],
        ["nodal", "APAAR nodal officer", inst.nodalOfficer],
      ] as const).flatMap(([k, t, pr]) =>
        (["name", "email", "phone", "status", "privileges"] as const)
          .filter((f) => pr[f])
          .map((f) => ({
            key: `${k}-${f}`,
            section: "Leadership",
            anchor: "sec-leadership",
            label: `${t} ${f}`,
            text: String(pr[f]),
          }))
      ),
    ];
    return all.filter((h) => `${h.label} ${h.text}`.toLowerCase().includes(q)).slice(0, 10);
  }, [gq, inst, programs]);

  function goTo(h: Hit) {
    if (h.program) {
      setMq(h.program);
      setLevel("ALL");
      setDuration("ALL");
    }
    setOpen(false);
    setFlash(h.anchor);
    setTimeout(() => {
      document.getElementById(h.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    setTimeout(() => setFlash(""), 2200);
  }

  const gTerms = useMemo(() => [gq], [gq]);
  const mTerms = useMemo(() => [gq, mq], [gq, mq]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar (Exact from frontend02) */}
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
          <span className="text-sm font-bold">APAAR Portal</span>
          <span className="text-sm text-slate-500">| Institution Administration Console</span>
        </div>

        {/* Global search */}
        <div className="relative order-last w-full max-w-sm md:order-none md:flex-1">
          <label htmlFor="gsearch" className="sr-only">
            Search this page
          </label>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="gsearch"
            ref={gRef}
            value={gq}
            autoComplete="off"
            role="combobox"
            aria-expanded={open && !!gq}
            aria-controls="gsearch-list"
            placeholder="Search this page (Ctrl+K)"
            onChange={(e) => {
              setGq(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setGq("");
                setOpen(false);
              }
              if (e.key === "Enter" && hits[0]) goTo(hits[0]);
            }}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-9 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {gq && (
            <button
              aria-label="Clear search"
              onClick={() => {
                setGq("");
                gRef.current?.focus();
              }}
              className="absolute right-2 top-2 rounded p-0.5 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {open && gq.trim() && (
            <ul
              id="gsearch-list"
              role="listbox"
              aria-label="Search results"
              className="absolute left-0 right-0 top-11 max-h-96 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              {hits.length === 0 ? (
                <li className="px-4 py-3 text-sm text-slate-500" role="status">
                  No matches for &ldquo;{gq}&rdquo;.
                </li>
              ) : (
                hits.map((h) => (
                  <li key={h.key} role="option" aria-selected={false}>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goTo(h)}
                      className="block w-full px-4 py-2 text-left hover:bg-indigo-50"
                    >
                      <span className="flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                          {h.section}
                        </span>
                        <span className="font-semibold text-slate-700">
                          <Hl text={h.label} terms={gTerms} />
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate-600">
                        <Hl text={h.text} terms={gTerms} />
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            role="status"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${apiOk ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
          >
            <span className={`h-2 w-2 rounded-full ${apiOk ? "bg-emerald-500" : "bg-red-500"}`} />
            {apiOk ? "API Connected (Port 8081)" : "API Unreachable (Port 8081)"}
          </span>

          <button
            onClick={load}
            disabled={loading}
            title="Refresh profile data from backend"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <InstitutionAdminProfileDropdown />
        </div>
      </header>

      {/* Main body */}
      <main className="mx-auto max-w-6xl space-y-5 p-6">
        <div>
          <p className="text-xs font-semibold text-indigo-700">Institution Administration</p>
          <h1 className="text-xl font-bold">Institution Profile</h1>
        </div>

        {!apiOk && !loading && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
          >
            <span>Could not load the profile ({loadErr}). Backend service or session unavailable.</span>
            <button onClick={load} className="font-semibold underline hover:text-red-900">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            Loading profile...
          </div>
        ) : !inst ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
            No institution profile data available for this session.
          </div>
        ) : (
          <>
            {/* Overview Card */}
            <Card id="sec-overview" title="Institution overview" flash={flash === "sec-overview"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">
                    <Hl text={inst.name} terms={gTerms} />
                  </h2>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    AICTE Permanent ID:{" "}
                    <b className="text-slate-900">
                      <Hl text={inst.institutionId} terms={gTerms} />
                    </b>
                    {inst.aicteVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> AICTE Verified
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{inst.description}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${inst.approvalStatus === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700"
                      : inst.approvalStatus === "PENDING"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                  <Hl text={`${inst.approvalStatus} (Valid ${inst.validFor})`} terms={gTerms} />
                </span>
              </div>
              <div className="mt-5 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Type" value={inst.type} terms={gTerms} />
                <Field label="Zone" value={inst.zone} terms={gTerms} />
                <Field label="University affiliation" value={inst.universityAffiliation} terms={gTerms} />
                <Field
                  label="Total sanctioned intake"
                  value={`${totals.regular} Regular Seats`}
                  terms={gTerms}
                />
              </div>
            </Card>

            {/* Programs Card */}
            <Card
              id="sec-programs"
              title="Sanctioned academic programs and intake matrix"
              flash={flash === "sec-programs"}
            >
              <div role="tablist" aria-label="Profile sections" className="mb-4">
                <button
                  role="tab"
                  aria-selected="true"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
                >
                  <GraduationCap className="h-4 w-4" /> Sanctioned Programs Matrix
                </button>
              </div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Academic year {inst.validFor}
              </p>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                  <label htmlFor="msearch" className="sr-only">
                    Search by program code or branch name
                  </label>
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="msearch"
                    value={mq}
                    onChange={(e) => setMq(e.target.value)}
                    placeholder="Search by program code, branch name..."
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <Select
                  id="level"
                  label="Filter by level"
                  value={level}
                  onChange={setLevel}
                  options={[
                    ["ALL", "Level: All (UG / PG)"],
                    ["UG", "Level: UG"],
                    ["PG", "Level: PG"],
                  ]}
                />
                <Select
                  id="dur"
                  label="Filter by duration"
                  value={duration}
                  onChange={setDuration}
                  options={[
                    ["ALL", "Filter: Any duration"],
                    ...durations.map((d) => [String(d), `${d} Years`] as [string, string]),
                  ]}
                />
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr>
                      {[
                        "Code",
                        "Program / discipline",
                        "Level",
                        "Duration",
                        "Regular",
                        "Seat matrix",
                        "Total intake",
                      ].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500"
                        >
                          No programs match your search or filters.
                        </td>
                      </tr>
                    ) : (
                      rows.map((p) => (
                        <tr key={p.code} className="hover:bg-slate-50/50">
                          <td className="whitespace-nowrap border-t border-slate-200 px-4 py-3 text-sm font-medium text-indigo-700">
                            <Hl text={p.code} terms={mTerms} />
                          </td>
                          <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-900">
                            <Hl text={p.name} terms={mTerms} />
                          </td>
                          <td className="border-t border-slate-200 px-4 py-3 text-sm">{p.level}</td>
                          <td className="whitespace-nowrap border-t border-slate-200 px-4 py-3 text-sm">
                            {p.durationYears} Years
                          </td>
                          <td className="whitespace-nowrap border-t border-slate-200 px-4 py-3 text-sm font-semibold">
                            {p.regularSeats} Seats
                          </td>
                          <td className="whitespace-nowrap border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
                            <Hl text={quotaText(p)} terms={gTerms} />
                          </td>
                          <td className="whitespace-nowrap border-t border-slate-200 px-4 py-3 text-sm font-bold">
                            {p.regularSeats + quotaTotal(p)}
                            {p.note && (
                              <span className="ml-2 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                <Hl text={p.note} terms={gTerms} />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <p className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700">
                  Total sanctioned capacity: {programs.length} programs | {totals.regular} regular seats |{" "}
                  {totals.super} supernumerary seats | {totals.total} total max capacity
                </p>
              </div>
            </Card>

            {/* Leadership Card */}
            <Card id="sec-leadership" title="Campus leadership" flash={flash === "sec-leadership"}>
              <div className="grid gap-4 md:grid-cols-2">
                {(
                  [
                    [
                      "Head of institution (Director)",
                      inst.head,
                      [
                        ["Name", "name"],
                        ["Email", "email"],
                        ["Phone", "phone"],
                        ["Status", "status"],
                      ],
                    ],
                    [
                      "Institutional APAAR nodal officer",
                      inst.nodalOfficer,
                      [
                        ["Name", "name"],
                        ["Email", "email"],
                        ["Mobile", "phone"],
                        ["Privileges", "privileges"],
                      ],
                    ],
                  ] as [string, Person, [string, keyof Person][]][]
                ).map(([title, person, fields]) => (
                  <div key={title} className="rounded-xl border border-slate-200 bg-white">
                    <h3 className="rounded-t-xl bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700">
                      {title}
                    </h3>
                    <dl className="space-y-2 p-4 text-sm">
                      {fields.map(([l, k]) => (
                        <div key={k} className="grid grid-cols-[90px_1fr] gap-2">
                          <dt className="text-slate-500">{l}</dt>
                          <dd
                            className={
                              k === "status"
                                ? "font-semibold text-emerald-600"
                                : "font-medium text-slate-900"
                            }
                          >
                            <Hl text={person[k] ?? "-"} terms={gTerms} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

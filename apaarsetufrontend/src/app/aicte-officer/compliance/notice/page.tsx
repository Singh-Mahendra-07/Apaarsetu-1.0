"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Rocket,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

/* -------------------------------- Types -------------------------------- */

type InstitutionOption = { id: string; name: string; affiliation: string };

type InstitutionProfile = {
  complianceScore: number;
  status: string; // UNDER_REVIEW ...
  violations: string[];
  recipients: { role: string; email: string }[];
};

type Recipient = { role: string; email: string };

/* ------------------------------ Static config ------------------------------ */

const NOTICE_TYPES = [
  {
    key: "SHOW_CAUSE_10_1_K",
    label: "Formal Show-Cause Notice: Section 10(1)(k) AICTE Act",
    subject: "Show-Cause for Unauthorized Over-Intake and Low Verification Pass Rate",
    days: 5,
  },
  {
    key: "ADVISORY_WARNING",
    label: "Advisory Warning Order",
    subject: "Advisory Warning: Compliance Shortfall in Current Academic Year",
    days: 10,
  },
  {
    key: "AUDIT_INQUIRY",
    label: "Compliance Deflection Audit Inquiry",
    subject: "Audit Inquiry: Compliance Deflection and Unanswered Alerts",
    days: 7,
  },
  {
    key: "LOW_VALIDATION_NOTICE",
    label: "Notice for low validation ratio",
    subject: "Notice: Student Record Validation Ratio Below Required Threshold",
    days: 7,
  },
] as const;

const GRACE_OPTIONS = [3, 5, 7, 10, 15];
const MAX_FILE_BYTES = 15 * 1024 * 1024;

// Used only if the API can't be reached.
const SAMPLE_INSTITUTIONS: InstitutionOption[] = [
  { id: "AICTE-INST-1003", name: "Northern Institute of Technology", affiliation: "Punjab Tech Univ" },
  { id: "AICTE-INST-1001", name: "Delhi Institute of Technology & Management", affiliation: "Delhi Tech University" },
  { id: "AICTE-INST-2002", name: "Bangalore Premier Business Academy", affiliation: "Bangalore Univ" },
];

const SAMPLE_PROFILES: Record<string, InstitutionProfile> = {
  "AICTE-INST-1001": {
    complianceScore: 78,
    status: "UNDER_REVIEW",
    violations: ["1 Pending Student Record Dispute", "Intake Compliance Monitoring"],
    recipients: [
      { role: "Principal", email: "admin@ditm.ac.in" },
      { role: "Registrar", email: "registrar@ditm.ac.in" },
    ],
  },
  "AICTE-INST-1003": {
    complianceScore: 58,
    status: "UNDER_REVIEW",
    violations: ["+15 Over-Intake", "Batch Submission 3 Days Overdue", "26% invalid records"],
    recipients: [
      { role: "Principal", email: "principal@nit.edu.in" },
      { role: "Registrar", email: "registrar@nit.edu.in" },
    ],
  },
  "AICTE-NITP-3201": {
    complianceScore: 92,
    status: "APPROVED",
    violations: ["Supernumerary quota verification"],
    recipients: [
      { role: "Director", email: "director@nitp.ac.in" },
      { role: "Admin", email: "gautam@nitp.ac.in" },
    ],
  },
};

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

/* -------------------------------- Helpers -------------------------------- */

function addBusinessDays(from: Date, n: number) {
  const d = new Date(from);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return d;
}

const formatDue = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatMb = (b: number) => `${(b / (1024 * 1024)).toFixed(1)} MB`;

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

/* --------------------------------- Page --------------------------------- */

// useSearchParams needs a Suspense boundary in the App Router.
export default function NoticePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-600">Loading...</div>}>
      <NoticeForm />
    </Suspense>
  );
}

function NoticeForm() {
  const params = useSearchParams();
  const presetId = params.get("institutionId");
  const presetType = params.get("type");

  const [apiUp, setApiUp] = useState(true);
  const [options, setOptions] = useState<InstitutionOption[]>([]);

  // Step 1
  const [selected, setSelected] = useState<InstitutionOption | null>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSample, setProfileSample] = useState(false);

  // Step 2
  const initialType = NOTICE_TYPES.find((t) => t.key === presetType) ?? NOTICE_TYPES[0];
  const [noticeType, setNoticeType] = useState<string>(initialType.key);
  const [subject, setSubject] = useState<string>(initialType.subject);
  const [subjectEdited, setSubjectEdited] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [days, setDays] = useState<number>(initialType.days);
  const [file, setFile] = useState<File | null>(null);
  const [charges, setCharges] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 3
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  /* ------------------------------ Load data ------------------------------ */

  useEffect(() => {
    (async () => {
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
          const rawList = Array.isArray(json?.institutions)
            ? json.institutions
            : Array.isArray(json?.data?.institutions)
            ? json.data.institutions
            : Array.isArray(json)
            ? json
            : [];
          if (rawList.length > 0) {
            const list: InstitutionOption[] = rawList.map((i: any) => ({
              id: i.id || i.aicteId,
              name: i.name,
              affiliation: i.universityAffiliation || i.affiliation || "",
            }));
            setOptions(list);
          }
          setApiUp(true);
        } else if (res.status === 401 || res.status === 403) {
          setApiUp(true);
        }
      } catch {
        // network error
      }
    })();
  }, []);

  // Pre-select the institution that came from the Issue Notice button.
  useEffect(() => {
    if (!presetId) return;
    const match = options.find((o) => o.id === presetId);
    if (match) {
      setSelected(match);
    } else if (!selected) {
      const sampleMatch = SAMPLE_INSTITUTIONS.find((s) => s.id === presetId);
      setSelected(
        sampleMatch ?? {
          id: presetId,
          name: presetId,
          affiliation: "",
        }
      );
    }
  }, [presetId, options, selected]);

  // GET /api/v1/institutions/{id}: compliance score, violations and recipients.
  useEffect(() => {
    if (!selected) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    setProfileSample(false);
    (async () => {
      try {
        const res = await fetch(`/api/v1/institutions/${selected.id}`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        const raw = (json && typeof json === "object" && "data" in json && json.data) ? json.data : json;

        const targetRecipients: Recipient[] = [];
        if (Array.isArray(raw?.recipients)) {
          targetRecipients.push(...raw.recipients);
        } else {
          if (raw?.headEmail) {
            targetRecipients.push({
              role: raw.headName ? `Head (${raw.headName})` : "Principal / Director",
              email: raw.headEmail,
            });
          }
          if (raw?.nodalOfficerEmail && raw.nodalOfficerEmail !== raw.headEmail) {
            targetRecipients.push({
              role: raw.nodalOfficerName ? `Nodal Officer (${raw.nodalOfficerName})` : "Nodal Officer",
              email: raw.nodalOfficerEmail,
            });
          }
        }

        if (targetRecipients.length === 0) {
          const sample = SAMPLE_PROFILES[selected.id];
          if (sample?.recipients && sample.recipients.length > 0) {
            targetRecipients.push(...sample.recipients);
          } else {
            targetRecipients.push({
              role: "Principal / Registrar",
              email: `admin@${selected.id.toLowerCase().replace(/[^a-z0-9]/g, "")}.ac.in`,
            });
          }
        }

        const formattedProfile: InstitutionProfile = {
          complianceScore: typeof raw?.complianceScore === "number" ? raw.complianceScore : 78,
          status: raw?.status || "UNDER_REVIEW",
          violations: Array.isArray(raw?.violations) ? raw.violations : (raw?.violation ? [raw.violation] : ["1 Pending Student Record Dispute", "Intake Compliance Monitoring"]),
          recipients: targetRecipients,
        };

        if (!cancelled) {
          setProfile(formattedProfile);
          setRecipients(targetRecipients);
        }
      } catch {
        if (cancelled) return;
        const p = SAMPLE_PROFILES[selected.id] ?? {
          complianceScore: 75,
          status: "UNDER_REVIEW",
          violations: ["Pending compliance verification"],
          recipients: [{ role: "Principal", email: `admin@${selected.id.toLowerCase().replace(/[^a-z0-9]/g, "")}.ac.in` }],
        };
        setProfile(p);
        setProfileSample(!!SAMPLE_PROFILES[selected.id]);
        setRecipients(Array.isArray(p?.recipients) ? p.recipients : []);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  /* ------------------------------ Derived data ------------------------------ */

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options.slice(0, 6);
    return options.filter((o) => `${o.id} ${o.name}`.toLowerCase().includes(q)).slice(0, 6);
  }, [options, search]);

  const dueDate = useMemo(() => addBusinessDays(new Date(), days), [days]);

  const safeRecipients = Array.isArray(recipients) ? recipients : [];

  const payload = {
    institutionId: selected?.id ?? "",
    noticeType,
    subject: subject.trim(),
    recipients: safeRecipients.map((r) => r.email),
    responseDueInDays: days,
    chargeDetails: charges.trim(),
  };

  /* ------------------------------- Handlers ------------------------------- */

  const changeType = (key: string) => {
    setNoticeType(key);
    const t = NOTICE_TYPES.find((x) => x.key === key);
    if (!t) return;
    setDays(t.days);
    if (!subjectEdited) setSubject(t.subject);
  };

  const addRecipient = () => {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((e) => ({ ...e, recipients: "Enter a valid email address." }));
      return;
    }
    if (safeRecipients.some((r) => r.email === email)) {
      setErrors((e) => ({ ...e, recipients: "That recipient is already on the list." }));
      return;
    }
    setRecipients([...safeRecipients, { role: "Additional", email }]);
    setNewEmail("");
    setErrors((e) => ({ ...e, recipients: "" }));
  };

  const takeFile = (f: File | undefined) => {
    if (!f) return;
    if (f.type !== "application/pdf") return setErrors((e) => ({ ...e, file: "Only PDF files are accepted." }));
    if (f.size > MAX_FILE_BYTES) return setErrors((e) => ({ ...e, file: "The file must be under 15 MB." }));
    setErrors((e) => ({ ...e, file: "" }));
    setFile(f);
  };

  const insertViolations = () => {
    if (!profile || !selected) return;
    const text = `Investigation of ${selected.name} (${selected.id}) confirms the following: ${profile.violations.join("; ")}. The institution is required to show cause why action should not be taken under the AICTE Act.`;
    setCharges(text);
    setErrors((e) => ({ ...e, charges: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selected) e.institution = "Select the institution this notice is for.";
    if (subject.trim().length < 5) e.subject = "Enter a subject for the notice.";
    if (safeRecipients.length === 0) e.recipients = "Add at least one recipient.";
    if (charges.trim().length < 20) e.charges = "Describe the charges in at least 20 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setSubmitError(null);
    try {
      let res: Response;
      if (file) {
        const body = new FormData();
        body.append("notice", JSON.stringify(payload));
        body.append("attachment", file);
        res = await fetch("/api/v1/compliance/notices", {
          method: "POST",
          headers: getAuthHeaders(),
          body,
        });
      } else {
        res = await fetch("/api/v1/compliance/notices", {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error(await readError(res));
      setSent(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not send the notice.");
    } finally {
      setBusy(false);
    }
  };

  const typeLabel = NOTICE_TYPES.find((t) => t.key === noticeType)?.label ?? noticeType;

  /* --------------------------------- View --------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-bold">APAAR Portal</p>
            <p className="text-xs text-slate-500">AICTE Nodal Officer Console</p>
          </div>
          <span className="ml-4 hidden text-sm font-semibold uppercase tracking-wide text-slate-700 sm:block">
            Send Notice &amp; Regulatory Inquiry
          </span>
        </div>
        <span
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
            apiUp ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${apiUp ? "bg-emerald-500" : "bg-red-500"}`} />
          {apiUp ? "API Connected (Port 8081)" : "API Unreachable (Port 8081)"}
        </span>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight">Send Regulatory Notice &amp; Show-Cause</h1>

        {sent ? (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-3 text-xl font-bold">Notice dispatched</h2>
            <p className="mt-1 text-slate-600">
              The notice for <b>{selected?.name}</b> was recorded and emailed to {safeRecipients.length}{" "}
              {safeRecipients.length === 1 ? "recipient" : "recipients"}. A response is due by{" "}
              <b>{formatDue(dueDate)}</b>.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/aicte-officer/compliance" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                Back to Compliance Monitor
              </Link>
              <button
                onClick={() => window.location.assign("/aicte-officer/compliance/notice")}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Send another notice
              </button>
            </div>
          </section>
        ) : (
          <form onSubmit={submit} noValidate className="mt-5 space-y-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Regulatory Compliance Division <span className="text-slate-400">-</span> North Zone
            </p>

            {/* ----------------------- Step 1: institution ----------------------- */}
            <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_340px]">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide">Step 1: Select Target Deficient Institution</h2>

                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                    placeholder="Search by AICTE ID or College Name... (e.g. AICTE-INST-1003)"
                    aria-label="Search institutions"
                    className={`${inputCls} pl-9`}
                  />
                  {searchOpen && (
                    <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
                      {matches.length === 0 && <li className="px-3 py-2 text-slate-500">No institutions found.</li>}
                      {matches.map((o) => (
                        <li key={o.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSelected(o);
                              setSearch("");
                              setSearchOpen(false);
                              setErrors((er) => ({ ...er, institution: "" }));
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <span className="font-medium">{o.id}</span> - {o.name}{" "}
                            <span className="text-slate-500">({o.affiliation})</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {selected && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm">
                    {selected.id} - {selected.name} ({selected.affiliation})
                    <button
                      type="button"
                      aria-label="Change institution"
                      onClick={() => {
                        setSelected(null);
                        setRecipients([]);
                      }}
                      className="text-slate-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </p>
                )}
                {errors.institution && <p className="mt-2 text-xs text-red-600">{errors.institution}</p>}
              </div>

              {/* Mapping panel */}
              <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm" aria-live="polite">
                <p className="mb-2 text-xs text-slate-600">
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono font-semibold text-emerald-800">GET</span>{" "}
                  <span className="font-mono">/api/v1/institutions/{selected?.id ?? "{id}"}</span>
                </p>
                {profileLoading && (
                  <p className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading profile...
                  </p>
                )}
                {!profileLoading && !profile && (
                  <p className="text-slate-600">
                    {selected ? "No compliance profile is available for this institution." : "Select an institution to see its compliance profile."}
                  </p>
                )}
                {profile && (
                  <ul className="space-y-1.5">
                    <li>
                      Compliance Score: <b>{profile.complianceScore}/100</b>
                    </li>
                    <li>
                      Status: <b>{profile.status}</b>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <span>
                        Active Violations: <b className="text-red-600">{profile.violations.join(", ")}</b>
                      </span>
                    </li>
                    {profileSample && <li className="pt-1 text-xs text-amber-800">Sample data: the API is unreachable.</li>}
                  </ul>
                )}
              </aside>
            </section>

            {/* ------------------------- Step 2: compose ------------------------- */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide">Step 2: Compose &amp; Configure Inquiry Notice</h2>

              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <div className="space-y-5">
                  <Field label="Statutory Notice Type" code="noticeType">
                    <select value={noticeType} onChange={(e) => changeType(e.target.value)} className={inputCls}>
                      {NOTICE_TYPES.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Response Grace Period" code="responseDueInDays">
                    <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={inputCls}>
                      {GRACE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n} Business Days
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-600">Due {formatDue(dueDate)}</p>
                  </Field>

                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-700">Attach Documentation (File Stream)</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        <Paperclip className="h-4 w-4" /> Upload Custom Audit Report / PDF
                      </button>
                      {file && (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <FileText className="h-4 w-4 text-slate-500" />
                          {file.name} ({formatMb(file.size)})
                          <button type="button" aria-label="Remove attachment" onClick={() => setFile(null)} className="text-slate-500 hover:text-red-600">
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          takeFile(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
                  </div>
                </div>

                <div className="space-y-5">
                  <Field label="Subject" code="subject" error={errors.subject}>
                    <input
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        setSubjectEdited(true);
                      }}
                      className={inputCls}
                    />
                  </Field>

                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-700">Target Recipients (Auto-Fetched)</p>
                    <div className="flex flex-wrap gap-2">
                      {safeRecipients.length === 0 && <span className="text-sm text-slate-500">No recipients yet. Select an institution or add one below.</span>}
                      {safeRecipients.map((r) => (
                        <span key={r.email} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-sm">
                          {r.role} ({r.email})
                          <button
                            type="button"
                            aria-label={`Remove ${r.email}`}
                            onClick={() => setRecipients(safeRecipients.filter((x) => x.email !== r.email))}
                            className="text-slate-500 hover:text-red-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addRecipient();
                          }
                        }}
                        placeholder="Add another recipient's email"
                        aria-label="Add recipient email"
                        className={inputCls}
                      />
                      <button type="button" onClick={addRecipient} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50">
                        <Plus className="h-4 w-4" /> Add
                      </button>
                    </div>
                    {errors.recipients && <p className="mt-1 text-xs text-red-600">{errors.recipients}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="charges" className="text-sm font-semibold text-slate-700">
                    Formal Compliance Charges Description{" "}
                    <code className="ml-1 rounded bg-slate-100 px-1 text-xs font-normal text-slate-500">chargeDetails</code>
                  </label>
                  {profile && (
                    <button type="button" onClick={insertViolations} className="text-sm font-medium text-indigo-700 hover:underline">
                      Insert violations summary
                    </button>
                  )}
                </div>
                <textarea
                  id="charges"
                  value={charges}
                  onChange={(e) => setCharges(e.target.value)}
                  rows={5}
                  placeholder="State the specific violations, the evidence, and what the institution must respond to."
                  className={inputCls}
                />
                {errors.charges && <p className="mt-1 text-xs text-red-600">{errors.charges}</p>}
              </div>
            </section>

            {/* ------------------------- Step 3: send ------------------------- */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide">Send Action Trigger Area</h2>
              <p className="mt-1 text-sm text-slate-600">
                Step 3: Authorize &amp; post to backend{" "}
                <span className="font-mono text-xs">POST /api/v1/compliance/notices</span>
              </p>

              <button
                type="button"
                onClick={() => setShowPayload((s) => !s)}
                aria-expanded={showPayload}
                className="mt-3 text-sm font-medium text-indigo-700 hover:underline"
              >
                {showPayload ? "Hide" : "Preview"} request payload
              </button>
              {showPayload && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              )}

              <p className="mt-3 text-sm text-slate-600">
                This will send a <b>{typeLabel}</b> to {safeRecipients.length || "no"} recipient{safeRecipients.length === 1 ? "" : "s"}
                {selected ? ` at ${selected.name}` : ""}, due {formatDue(dueDate)}. It will be recorded in the audit log.
              </p>

              {submitError && (
                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {submitError}
                </p>
              )}

              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <Link href="/aicte-officer/compliance" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50">
                  Cancel &amp; Go Back
                </Link>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {busy ? "Sending..." : "Send Notice & Dispatch Email Notification"}
                </button>
              </div>
            </section>
          </form>
        )}
      </main>
    </div>
  );
}

/* ------------------------------ Small pieces ------------------------------ */

function Field({
  label,
  code,
  error,
  children,
}: {
  label: string;
  code: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">
        {label} <code className="ml-1 rounded bg-slate-100 px-1 text-xs font-normal text-slate-500">{code}</code>
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Rocket,
  ShieldCheck,
  UploadCloud,
  UserCog,
  X,
} from "lucide-react";

/* -------------------------------- Types -------------------------------- */

type AccountType = "AICTE_OFFICER" | "INSTITUTION_ADMIN";

type FormState = {
  accountType: AccountType;
  fullName: string;
  email: string;
  phone: string;
  zone: string;
  institution: string;
  designation: string;
  employeeId: string;
  password: string;
  mfa: boolean;
  privileges: Record<string, boolean>;
};

type Errors = Partial<Record<string, string>>;

/* ------------------------------ Static config ------------------------------ */

const ZONES = [
  "NORTH ZONE (DELHI, PUNJAB, HR)",
  "SOUTH ZONE (KA, TN, KL, TS, AP)",
  "WEST ZONE (MH, GJ, GA, RJ)",
  "EAST ZONE (WB, BH, OR, JH, AS)",
  "CENTRAL ZONE (MP, CG)",
];

type InstitutionOption = {
  id: string;
  aicteId: string;
  name: string;
  display: string;
};

const FALLBACK_INSTITUTIONS: InstitutionOption[] = [
  { id: "AICTE-INST-1001", aicteId: "AICTE-INST-1001", name: "Delhi Institute of Technology & Management", display: "AICTE-INST-1001 – Delhi Institute of Technology & Management" },
  { id: "AICTE-INST-1002", aicteId: "AICTE-INST-1002", name: "Mumbai Metropolitan College of Engineering", display: "AICTE-INST-1002 – Mumbai Metropolitan College of Engineering" },
  { id: "AICTE-NITP-3201", aicteId: "AICTE-NITP-3201", name: "National Institute of Technology Patna", display: "AICTE-NITP-3201 – National Institute of Technology Patna" },
];

const PRIVILEGES: Record<AccountType, { key: string; label: string; locked?: boolean }[]> = {
  AICTE_OFFICER: [
    { key: "viewRegistries", label: "View All Institutional Registries (Region-specific)" },
    { key: "processIntake", label: "Process Intake & Capacity Violations" },
    { key: "resolveFlags", label: "Issue Flag & Dispute Resolves" },
    { key: "bypassValidation", label: "Bypass Document Validation (Needs SuperAdmin approval)", locked: true },
  ],
  INSTITUTION_ADMIN: [
    { key: "manageProfile", label: "Manage Institution Profile & Programs" },
    { key: "submitIntake", label: "Submit Intake & Enrollment Data" },
    { key: "respondFlags", label: "Respond to Flags & Disputes" },
    { key: "bypassValidation", label: "Bypass Document Validation (Needs SuperAdmin approval)", locked: true },
  ],
};

const defaultPrivileges = (t: AccountType) =>
  Object.fromEntries(PRIVILEGES[t].map((p) => [p.key, !p.locked]));

const INITIAL: FormState = {
  accountType: "AICTE_OFFICER",
  fullName: "",
  email: "",
  phone: "",
  zone: ZONES[0],
  institution: "",
  designation: "",
  employeeId: "",
  password: "",
  mfa: true,
  privileges: defaultPrivileges("AICTE_OFFICER"),
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

/* -------------------------------- Helpers -------------------------------- */

const formatSize = (b: number) => `${(b / (1024 * 1024)).toFixed(1)}MB`;

function generatePassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%&*?"];
  const all = sets.join("");
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const chars = sets.map((s) => s[rnd(s.length)]); // at least one of each kind
  while (chars.length < 16) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
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

export default function RegisterOfficialPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [autoGen, setAutoGen] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [apiUp, setApiUp] = useState(true);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => setApiUp(r.ok))
      .catch(() => setApiUp(false));

    const token = typeof window !== "undefined"
      ? (localStorage.getItem("apaarsetu_access_token") || localStorage.getItem("token"))
      : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    setLoadingInstitutions(true);
    fetch("/api/v1/institutions?page=0&size=200", { headers, cache: "no-store" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data) && data.length > 0) {
            const formatted: InstitutionOption[] = data.map((inst: any) => {
              const code = inst.aicteId || inst.id;
              const name = inst.name || inst.institutionName || "Unknown Institution";
              return {
                id: inst.id || code,
                aicteId: code,
                name: name,
                display: `${code} – ${name}`,
              };
            });
            setInstitutions(formatted);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load institutions:", err);
      })
      .finally(() => {
        setLoadingInstitutions(false);
      });
  }, []);

  const isAicte = form.accountType === "AICTE_OFFICER";
  const roleName = isAicte ? "ROLE_AICTE_OFFICER" : "ROLE_INSTITUTION_ADMIN";

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const changeType = (t: AccountType) =>
    setForm((f) => ({ ...f, accountType: t, privileges: defaultPrivileges(t), email: "" }));

  /* ----------------------------- Validation ----------------------------- */

  const validateStep1 = () => {
    const e: Errors = {};
    if (!form.fullName.trim()) e.fullName = "Enter the official's full legal name.";
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    else if (isAicte && !email.endsWith("@aicte.gov.in"))
      e.email = "AICTE officers must use an @aicte.gov.in address.";
    if (!/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(form.phone.trim()))
      e.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!isAicte) {
      const trimmed = form.institution.trim();
      const matched = institutions.find(
        (i) =>
          i.display.toLowerCase() === trimmed.toLowerCase() ||
          i.aicteId.toLowerCase() === trimmed.toLowerCase() ||
          i.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (!trimmed) {
        e.institution = "Pick an approved institution from the list.";
      } else if (institutions.length > 0 && !matched && !trimmed.includes(" – ")) {
        e.institution = "Pick an approved institution from the list.";
      }
    }
    if (!form.designation.trim()) e.designation = "Enter a designation.";
    if (!form.employeeId.trim()) e.employeeId = "Enter the employee or ID card number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Errors = {};
    const pw = form.password;
    if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/\d/.test(pw))
      e.password = "Use at least 10 characters with upper case, lower case and a number, or generate one.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* ------------------------------ File handling ------------------------------ */

  const takeFile = (f: File | undefined) => {
    if (!f) return;
    if (f.type !== "application/pdf") return setErrors((e) => ({ ...e, file: "Only PDF files are accepted." }));
    if (f.size > MAX_FILE_BYTES) return setErrors((e) => ({ ...e, file: "The file must be under 5 MB." }));
    setErrors((e) => ({ ...e, file: undefined }));
    setFile(f);
  };

  /* ------------------------------- Password ------------------------------- */

  const toggleAutoGen = (on: boolean) => {
    setAutoGen(on);
    if (on) {
      set("password", generatePassword());
      setReveal(true);
    } else {
      set("password", "");
      setReveal(false);
    }
  };

  /* -------------------------------- Submit -------------------------------- */

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setBusy(true);
    setSubmitError(null);
    try {
      let institutionCode = form.institution.trim();
      const matchedInst = institutions.find(
        (i) =>
          i.display.toLowerCase() === institutionCode.toLowerCase() ||
          i.aicteId.toLowerCase() === institutionCode.toLowerCase() ||
          i.name.toLowerCase() === institutionCode.toLowerCase()
      );
      if (matchedInst) {
        institutionCode = matchedInst.aicteId;
      } else if (institutionCode.includes(" – ")) {
        institutionCode = institutionCode.split(" – ")[0].trim();
      }

      const dto = {
        role: roleName,
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        zone: isAicte ? form.zone.split(" ")[0].trim().toUpperCase() : null,
        institutionId: isAicte ? null : institutionCode,
        designation: form.designation.trim(),
        employeeId: form.employeeId.trim(),
        tempPassword: form.password.trim(),
        mfaRequired: form.mfa,
        privileges: Object.keys(form.privileges).filter((k) => form.privileges[k]),
      };
      const body = new FormData();
      body.append("user", new Blob([JSON.stringify(dto)], { type: "application/json" }));
      if (file) {
        body.append("appointmentOrder", file);
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/admin/users", { method: "POST", headers, body });
      if (!res.ok) throw new Error(await readError(res));
      setDone(dto.email);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not register the official.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setForm(INITIAL);
    setFile(null);
    setErrors({});
    setAutoGen(false);
    setReveal(false);
    setSubmitError(null);
    setDone(null);
    setStep(1);
  };

  /* --------------------------------- View --------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
          {/* <button
            aria-label="Notifications"
            className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              1
            </span>
          </button> */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-sm font-medium">AICTE Admin</span>
            <div className="h-8 w-8 rounded-full bg-slate-300" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-8 py-6">
        <Link
          href="/aicte-admin/user-management"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to User Management
        </Link>

        <p className="mt-4 text-sm font-medium uppercase tracking-wide text-indigo-600">
          System Administration Portal
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Register New Official</h1>
        <p className="mt-1 text-slate-700">
          Provision secure credentials, assign jurisdictions, and enforce compliance for AICTE
          Regional Officers and University/College Admins.
        </p>

        {done ? (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-3 text-xl font-bold">Official registered</h2>
            <p className="mt-1 text-slate-600">
              Credentials have been emailed to <span className="font-medium">{done}</span>. They must
              change the temporary password on first login.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/aicte-admin/user-management"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Back to User Management
              </Link>
              <button
                onClick={reset}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Register another official
              </button>
            </div>
          </section>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6">
            {/* Step indicator */}
            <ol className="mb-5 flex items-center gap-3 text-sm" aria-label="Progress">
              {[
                { n: 1, label: "Registry & Role" },
                { n: 2, label: "Security & Regulatory Access" },
              ].map((s, i) => (
                <li key={s.n} className="flex items-center gap-3">
                  {i > 0 && <span className="h-px w-10 bg-slate-300" />}
                  <span
                    aria-current={step === s.n ? "step" : undefined}
                    className={`flex items-center gap-2 font-medium ${
                      step === s.n ? "text-indigo-700" : step > s.n ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        step === s.n
                          ? "bg-indigo-600 text-white"
                          : step > s.n
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {step > s.n ? <Check className="h-4 w-4" /> : s.n}
                    </span>
                    {s.label}
                  </span>
                </li>
              ))}
            </ol>

            {/* ---------------------- Step 1: Registry & Role ---------------------- */}
            {step === 1 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wide">1. Registry &amp; Role</h3>

                <fieldset className="mt-4">
                  <legend className="mb-2 text-sm font-medium text-slate-700">Select Account Type</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TypeCard
                      checked={isAicte}
                      onSelect={() => changeType("AICTE_OFFICER")}
                      icon={<UserCog className="h-8 w-8" />}
                      label="AICTE Nodal Officer (Regional)"
                    />
                    <TypeCard
                      checked={!isAicte}
                      onSelect={() => changeType("INSTITUTION_ADMIN")}
                      icon={<Building2 className="h-8 w-8" />}
                      label="University / College Admin (Institutional)"
                    />
                  </div>
                </fieldset>

                <div className="mt-6 space-y-5">
                  <Row label="Full Legal Name" error={errors.fullName}>
                    <input
                      value={form.fullName}
                      onChange={(e) => set("fullName", e.target.value)}
                      placeholder="Dr. S. K. Sharma"
                      className={inputCls}
                    />
                  </Row>
                  <Row
                    label="Official Email ID"
                    error={errors.email}
                    hint={isAicte ? "(enforces @aicte.gov.in)" : undefined}
                  >
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder={isAicte ? "sksharma@aicte.gov.in" : "principal@college.ac.in"}
                      className={inputCls}
                    />
                  </Row>
                  <Row label="Phone Number" error={errors.phone}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                      className={inputCls}
                    />
                  </Row>
                  <Row label="Regional / Zonal Jurisdiction" sub="(for AICTE Officer)">
                    <select
                      value={form.zone}
                      onChange={(e) => set("zone", e.target.value)}
                      disabled={!isAicte}
                      className={inputCls}
                    >
                      {ZONES.map((z) => (
                        <option key={z}>{z}</option>
                      ))}
                    </select>
                  </Row>
                  <Row
                    label="Assigned University/College"
                    sub={isAicte ? "Not applicable for AICTE Nodal Officers" : "Required for College Admins"}
                    error={errors.institution}
                    muted={isAicte}
                  >
                    <input
                      list="institutions"
                      value={form.institution}
                      onChange={(e) => set("institution", e.target.value)}
                      disabled={isAicte}
                      placeholder={
                        loadingInstitutions
                          ? "Loading approved institutions..."
                          : "Search Approved Institution ID/Name"
                      }
                      className={inputCls}
                    />
                    <datalist id="institutions">
                      {institutions.map((i) => (
                        <option key={i.id || i.aicteId} value={i.display}>
                          {i.name}
                        </option>
                      ))}
                    </datalist>
                  </Row>
                  <Row label="Designation" error={errors.designation}>
                    <input
                      value={form.designation}
                      onChange={(e) => set("designation", e.target.value)}
                      placeholder={isAicte ? "Regional Director" : "Principal"}
                      className={inputCls}
                    />
                  </Row>
                  <Row label="Official ID Card Number / Employee ID" error={errors.employeeId}>
                    <input
                      value={form.employeeId}
                      onChange={(e) => set("employeeId", e.target.value)}
                      placeholder="EMP-AICTE-4412"
                      className={inputCls}
                    />
                  </Row>
                </div>
              </section>
            )}

            {/* ------------------ Step 2: Security & Regulatory Access ------------------ */}
            {step === 2 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  2. Security &amp; Regulatory Access
                </h3>

                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700">Access Level &amp; Role Designation</p>
                  <p className="mt-1.5 text-sm text-slate-700">
                    <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-800">
                      {roleName}
                    </span>{" "}
                    <span className="text-slate-500">(set from the account type you chose)</span>
                  </p>
                </div>

                {/* Password */}
                <div className="mt-6">
                  <label htmlFor="temp-password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="mt-1.5 flex flex-wrap items-start gap-3">
                    <div className="relative min-w-[240px] flex-1">
                      <input
                        id="temp-password"
                        type={reveal ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                        readOnly={autoGen}
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        className={`${inputCls} pr-16 ${autoGen ? "font-mono" : ""}`}
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {form.password && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(form.password);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            aria-label="Copy password to clipboard"
                            title={copied ? "Copied!" : "Copy password"}
                            className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          >
                            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setReveal((r) => !r)}
                          aria-label={reveal ? "Hide password" : "Reveal password"}
                          title={reveal ? "Hide password" : "Reveal password"}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                          {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
                      <Switch checked={autoGen} onChange={toggleAutoGen} label="Generate secure password" />
                      <span className="select-none">
                        Generate Secure Password <span className="text-slate-400">&amp;</span>{" "}
                        <span className="text-indigo-700">Reveal</span>
                      </span>
                    </div>
                  </div>
                  {errors.password ? (
                    <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-600">
                      User will be forced to change this on first login.
                    </p>
                  )}
                </div>

                {/* MFA */}
                {/* <div className="mt-6">
                  <p className="text-sm font-medium text-slate-700">MFA / 2FA Requirement</p>
                  <label className="mt-1.5 flex items-center gap-3 text-sm">
                    <Switch checked={form.mfa} onChange={(v) => set("mfa", v)} label="Mandate two-factor authentication" />
                    Mandate Two-Factor Authentication (TOTP)
                  </label>
                  {!form.mfa && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700">
                      <ShieldCheck className="h-4 w-4" /> Accounts without MFA are not recommended for regulatory access.
                    </p>
                  )}
                </div> */}

                {/* Privileges */}
                {/* <fieldset className="mt-6">
                  <legend className="text-sm font-medium text-slate-700">Account Jurisdictional Privileges</legend>
                  <div className="mt-2 space-y-2">
                    {PRIVILEGES[form.accountType].map((p) => (
                      <label key={p.key} className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={!!form.privileges[p.key]}
                          disabled={p.locked}
                          onChange={(e) =>
                            set("privileges", { ...form.privileges, [p.key]: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-slate-300 accent-indigo-600 disabled:opacity-50"
                        />
                        <span className={p.locked ? "text-slate-500" : ""}>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset> */}

                {/* Upload */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-700">
                    Uploaded Appointment Order / Gazette Notification (Optional)
                  </p>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      takeFile(e.dataTransfer.files?.[0]);
                    }}
                    className={`mt-2 rounded-xl border-2 border-dashed p-5 text-sm ${
                      dragging ? "border-indigo-500 bg-indigo-50" : errors.file ? "border-red-300" : "border-slate-300"
                    }`}
                  >
                    {file ? (
                      <div className="flex items-center gap-2 font-medium">
                        <FileText className="h-5 w-5 text-slate-500" />
                        {file.name} ({formatSize(file.size)})
                        <button
                          type="button"
                          aria-label="Remove file"
                          onClick={() => setFile(null)}
                          className="text-slate-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 font-medium text-indigo-700 hover:underline"
                      >
                        <UploadCloud className="h-5 w-5" /> Choose a PDF
                      </button>
                    )}
                    <p className="mt-2 text-slate-600">Drag and drop AICTE / Ministry appointment letters here (optional)</p>
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
                  {errors.file && <p className="mt-1.5 text-xs text-red-600">{errors.file}</p>}
                </div>
              </section>
            )}

            {submitError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {submitError}
              </p>
            )}

            {/* ------------------------------ Actions ------------------------------ */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs italic text-slate-500">
                {step === 2 ? "→ API Action: POST /api/v1/admin/users" : `Step ${step} of 2`}
              </p>
              <div className="flex gap-3">
                {step === 1 ? (
                  <Link
                    href="/aicte-admin/user-management"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel &amp; Go Back
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                )}

                {step === 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                    {busy ? "Registering..." : "Register Official & Email Credentials"}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

/* ------------------------------ Small pieces ------------------------------ */

function Row({
  label,
  sub,
  hint,
  error,
  muted,
  children,
}: {
  label: string;
  sub?: string;
  hint?: string;
  error?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[240px_1fr] sm:gap-6">
      <div className={`text-sm ${muted ? "text-slate-400" : "text-slate-800"}`}>
        <p className="font-medium">{label}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
      <div>
        {children}
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : (
          hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>
        )}
      </div>
    </div>
  );
}

function TypeCard({
  checked,
  onSelect,
  icon,
  label,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 ${
        checked ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white hover:border-indigo-300"
      }`}
    >
      <input type="radio" name="accountType" checked={checked} onChange={onSelect} className="h-4 w-4 accent-indigo-600" />
      <span className={checked ? "text-indigo-600" : "text-slate-500"}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  Landmark,
  Loader2,
  Lock,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const API_HEALTH = "/api/v1/health";
const HEALTH_INTERVAL_MS = 30000;

type RoleId = "aicte" | "institution" | "verifier";
type SubRole = string;

// After a successful sign-in the user is routed here, based on account type.
const DASHBOARD_ROUTES: Record<string, string> = {
  ADMIN: "/aicte-admin",
  NODAL_OFFICER: "/aicte-officer",
  INSTITUTION_ADMIN: "/institution-admin",
  OPERATOR: "/institution-operator",
  VERIFIER: "/authorized-verifier",
};

const ROLE_TO_DASHBOARD: Record<string, string> = {
  ROLE_AICTE_ADMIN: "/aicte-admin",
  ROLE_AICTE_OFFICER: "/aicte-officer",
  ROLE_INSTITUTION_ADMIN: "/institution-admin",
  ROLE_INSTITUTION_OPERATOR: "/institution-operator",
  ROLE_AUTHORIZED_VERIFIER: "/authorized-verifier",
};

interface Role {
  id: RoleId;
  title: string;
  subtitle: string;
  description: string;
  points: string[];
  Icon: typeof Landmark;
  idLabel: string;
  idPlaceholder: string;
  subRoles?: [value: string, label: string][];
}

const ROLES: Role[] = [
  {
    id: "aicte",
    title: "AICTE",
    subtitle: "Admin and nodal officers",
    description:
      "Central control and regional oversight of institutions across the country.",
    points: [
      "Approve and suspend institutions",
      "Monitor intake and compliance",
      "Review batch submissions",
    ],
    Icon: Landmark,
    idLabel: "Official email or employee ID",
    idPlaceholder: "admin@aicte.gov.in",
    subRoles: [
      ["ADMIN", "AICTE Admin"],
      ["NODAL_OFFICER", "AICTE Officer"],
    ],
  },
  {
    id: "institution",
    title: "Institution",
    subtitle: "College administrators",
    description:
      "Manage sanctioned seats, student records and ERP sync for your institution.",
    points: [
      "Upload and validate student batches",
      "Track intake utilization",
      "Manage ERP API keys",
    ],
    Icon: Building2,
    idLabel: "Institution ID or registered email",
    idPlaceholder: "admin@ditm.ac.in",
    subRoles: [
      ["INSTITUTION_ADMIN", "Institution Admin"],
      ["OPERATOR", "Institution Operator"],
    ],
  },
  {
    id: "verifier",
    title: "Academic AuthDesk",
    subtitle: "Employers and agencies",
    description:
      "Check the authenticity of student APAAR records and credentials.",
    points: [
      "Verify student credentials",
      "View verification history",
      "Download verification reports",
    ],
    Icon: BadgeCheck,
    idLabel: "Verifier ID or registered email",
    idPlaceholder: "verifier@tcs.com",
  },
];

function OfficialsLoginContent() {
  const searchParams = useSearchParams();
  const { login, verifyMfa } = useAuth();

  const [selected, setSelected] = useState<RoleId | null>(null);
  const [subRole, setSubRole] = useState<SubRole>("ADMIN");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaOtp, setMfaOtp] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState<{ userId: string; challengeToken: string } | null>(null);
  const [mfaSubmitting, setMfaSubmitting] = useState(false);
  const [mfaError, setMfaError] = useState("");

  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiUp, setApiUp] = useState<boolean | null>(null);

  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const idRef = useRef<HTMLInputElement>(null);

  const role = ROLES.find((r) => r.id === selected) ?? null;

  const errorParam = searchParams.get("error");
  const redirectParam = searchParams.get("redirect");

  // Sync error or auto-select role from redirect query parameters
  useEffect(() => {
    if (errorParam === "invalid_token") {
      setServerError("Your session has expired or token was invalid. Please sign in again.");
    } else if (errorParam === "unauthorized_role") {
      setServerError("Your account is not authorized to access that portal. Please sign in with an authorized account.");
    }

    if (redirectParam) {
      if (redirectParam.startsWith("/institution")) {
        setSelected((prev) => prev || "institution");
        if (redirectParam.includes("operator")) {
          setSubRole("OPERATOR");
        } else {
          setSubRole((prev) => (prev === "ADMIN" ? "INSTITUTION_ADMIN" : prev));
        }
      } else if (redirectParam.startsWith("/aicte")) {
        setSelected((prev) => prev || "aicte");
        if (redirectParam.includes("officer")) {
          setSubRole("NODAL_OFFICER");
        } else {
          setSubRole((prev) => (prev === "INSTITUTION_ADMIN" ? "ADMIN" : prev));
        }
      } else if (redirectParam.startsWith("/authorized-verifier")) {
        setSelected((prev) => prev || "verifier");
      }
    }
  }, [errorParam, redirectParam]);

  // Check API availability.
  useEffect(() => {
    let alive = true;

    async function checkApi() {
      try {
        const response = await fetch(API_HEALTH, {
          cache: "no-store",
        });

        if (alive) {
          setApiUp(response.ok);
        }
      } catch {
        if (alive) {
          setApiUp(false);
        }
      }
    }

    void checkApi();

    const timer = setInterval(checkApi, HEALTH_INTERVAL_MS);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  // Focus the login input without scrolling the page.
  useEffect(() => {
    if (!selected) return;

    idRef.current?.focus({ preventScroll: true });
  }, [selected]);

  // Escape returns to role selection.
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && selected && !submitting) {
        clearRole();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, submitting]);

  function clearRole() {
    const previousRole = selected;

    setSelected(null);
    setIdentifier("");
    setPassword("");
    setErrors({});
    setServerError("");
    setShowPw(false);

    if (previousRole) {
      setTimeout(() => {
        cardRefs.current[previousRole]?.focus();
      }, 0);
    }
  }

  function chooseRole(id: RoleId) {
    if (submitting) return;

    const chosenRole = ROLES.find((item) => item.id === id);

    setSelected(id);
    setSubRole(chosenRole?.subRoles?.[0]?.[0] ?? "VERIFIER");
    setIdentifier("");
    setPassword("");
    setErrors({});
    setServerError("");
    setShowPw(false);
  }

  function handleGroupKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)
    ) {
      return;
    }

    event.preventDefault();

    const currentIndex = ROLES.findIndex(
      (item) => item.id === (selected ?? ROLES[0].id)
    );

    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;

    const nextRole =
      ROLES[(currentIndex + step + ROLES.length) % ROLES.length];

    chooseRole(nextRole.id);
    cardRefs.current[nextRole.id]?.focus();
  }

  function validate() {
    const nextErrors: {
      identifier?: string;
      password?: string;
    } = {};

    if (!identifier.trim()) {
      nextErrors.identifier = "Enter your ID or email.";
    }

    if (!password) {
      nextErrors.password = "Enter your password.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!role || submitting) return;

    setServerError("");

    if (!validate()) return;

    setSubmitting(true);

    try {
      let email = identifier.trim();

      // Resolve institution ID or shorthand to email
      if (!email.includes("@")) {
        const cleanId = email.toUpperCase();
        if (cleanId === "AICTE-INST-1001") {
          email = subRole === "OPERATOR" ? "operator@ditm.ac.in" : "admin@ditm.ac.in";
        } else if (cleanId === "AICTE-INST-1002") {
          email = "admin@spce.ac.in";
        } else if (cleanId === "AICTE-NITP-3201" || cleanId === "AICTE-TEST-5827") {
          email = "gautam@nitp.ac.in";
        } else {
          setServerError("Please enter a valid official email address (e.g. name@aicte.gov.in)");
          setSubmitting(false);
          return;
        }
      }

      // Authenticate directly with Spring Boot backend through AuthContext
      const response = await login(email, password);

      // Handle MFA challenge response
      if (response.mfaRequired) {
        setMfaChallenge({
          userId: response.userId || "",
          challengeToken: response.mfaChallengeToken || response.mfaToken || "",
        });
        setShowMfaModal(true);
        setSubmitting(false);
        return;
      }

      // Verify role authorization
      const userRole = response.user?.role;
      if (
        role.id === "aicte" &&
        userRole !== "ROLE_AICTE_ADMIN" &&
        userRole !== "ROLE_AICTE_OFFICER"
      ) {
        setServerError(
          `Unauthorized role: ${userRole}. This portal is restricted to AICTE officials.`
        );
        return;
      }
      if (
        role.id === "institution" &&
        userRole !== "ROLE_INSTITUTION_ADMIN" &&
        userRole !== "ROLE_INSTITUTION_OPERATOR"
      ) {
        setServerError(
          `Unauthorized role: ${userRole}. This portal is restricted to Institution staff.`
        );
        return;
      }
      if (
        role.id === "verifier" &&
        userRole !== "ROLE_AUTHORIZED_VERIFIER"
      ) {
        setServerError(
          `Unauthorized role: ${userRole}. This portal is restricted to Authorized Verifiers.`
        );
        return;
      }

      // Select the correct destination for the chosen account type.
      let destination: string;
      if (
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//") &&
        ((userRole === "ROLE_INSTITUTION_ADMIN" && redirectParam.startsWith("/institution-admin")) ||
          (userRole === "ROLE_INSTITUTION_OPERATOR" && redirectParam.startsWith("/institution-operator")) ||
          (userRole === "ROLE_AICTE_ADMIN" && redirectParam.startsWith("/aicte-admin")) ||
          (userRole === "ROLE_AICTE_OFFICER" && redirectParam.startsWith("/aicte-officer")) ||
          (userRole === "ROLE_AUTHORIZED_VERIFIER" && redirectParam.startsWith("/authorized-verifier")))
      ) {
        destination = redirectParam;
      } else if (userRole && ROLE_TO_DASHBOARD[userRole]) {
        destination = ROLE_TO_DASHBOARD[userRole];
      } else {
        destination =
          role.id === "verifier"
            ? DASHBOARD_ROUTES.VERIFIER
            : DASHBOARD_ROUTES[subRole] || "/";
      }

      // Use window.location.href to guarantee synchronous cookie propagation to edge middleware
      window.location.href = destination;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Sign in failed. Check your credentials and try again.";
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMfaSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mfaChallenge || mfaSubmitting) return;
    if (!mfaOtp || mfaOtp.trim().length !== 6) {
      setMfaError("Please enter a valid 6-digit verification code");
      return;
    }

    setMfaSubmitting(true);
    setMfaError("");

    try {
      const resp = await verifyMfa(mfaChallenge.userId, mfaOtp.trim(), mfaChallenge.challengeToken);
      const userRole = resp.user?.role;
      let destination: string;
      if (userRole && ROLE_TO_DASHBOARD[userRole]) {
        destination = ROLE_TO_DASHBOARD[userRole];
      } else {
        destination = DASHBOARD_ROUTES[subRole] || "/";
      }
      window.location.href = destination;
    } catch (err: unknown) {
      setMfaError(err instanceof Error ? err.message : "Invalid or expired MFA verification code");
    } finally {
      setMfaSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-700 px-6 py-7 text-white shadow-xl shadow-indigo-900/20 sm:flex-row sm:items-center sm:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
              <GraduationCap className="h-4 w-4" />
              apaarSetu
            </span>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Sign in to APAAR Portal
            </h1>

            <p className="mt-2 text-slate-200">
              {role
                ? `Sign in to continue as ${role.title}.`
                : "Select your role to continue."}
            </p>
          </div>

          <span
            role="status"
            aria-live="polite"
            className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-semibold ${apiUp === false
              ? "border-red-300 bg-red-500/20 text-red-100"
              : "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
              }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${apiUp === false ? "bg-red-400" : "bg-emerald-400"
                }`}
            />
            {apiUp === null
              ? "Connecting..."
              : apiUp
                ? "National Gateway Operational"
                : "Gateway Connection Interrupted"}
          </span>
        </section>

        {/* Show role cards only before a role is selected. */}
        {!role && (
          <>
            <div
              role="radiogroup"
              aria-label="Select your role"
              onKeyDown={handleGroupKeyDown}
              className="mt-8 grid gap-6 md:grid-cols-3"
            >
              {ROLES.map((item) => (
                <button
                  key={item.id}
                  ref={(element) => {
                    cardRefs.current[item.id] = element;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={false}
                  tabIndex={item.id === ROLES[0].id ? 0 : -1}
                  onClick={() => chooseRole(item.id)}
                  className="group flex min-h-[24rem] flex-col rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-sm outline-none transition duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-purple-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-white transition-colors group-hover:bg-purple-600">
                    <item.Icon className="h-10 w-10" />
                  </span>

                  <span className="mt-6 text-2xl font-extrabold tracking-tight">
                    {item.title}
                  </span>

                  <span className="text-sm font-medium text-purple-700">
                    {item.subtitle}
                  </span>

                  <span className="mt-3 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </span>

                  <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-sm text-slate-700">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-purple-600" />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-purple-700">
                    Continue to login
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              Choose a role to open its login form.
            </p>
          </>
        )}

        {/* The selected login form replaces the role cards. */}
        {role && (
          <section
            aria-label={`${role.title} login`}
            className="mx-auto mt-8 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-purple-50 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <role.Icon className="h-6 w-6" />
                </span>

                <div>
                  <h2 className="text-xl font-extrabold">{role.title} login</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Use the credentials issued to you.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clearRole}
                disabled={submitting}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Change role
              </button>
            </div>

            <form
              onSubmit={onSubmit}
              noValidate
              className="space-y-5 px-6 py-6 sm:px-8"
            >
              {role.subRoles && (
                <div
                  role="group"
                  aria-label={`${role.title} account type`}
                  className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
                >
                  {role.subRoles.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={subRole === value}
                      onClick={() => setSubRole(value)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${subRole === value
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  {role.idLabel}
                </label>

                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="identifier"
                    ref={idRef}
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder={role.idPlaceholder}
                    aria-invalid={!!errors.identifier}
                    aria-describedby={
                      errors.identifier ? "identifier-error" : undefined
                    }
                    className={`w-full rounded-xl border bg-white py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-purple-200 ${errors.identifier
                      ? "border-red-400"
                      : "border-slate-300 focus:border-purple-500"
                      }`}
                  />
                </div>

                {errors.identifier && (
                  <p
                    id="identifier-error"
                    className="mt-1 text-xs font-medium text-red-600"
                  >
                    {errors.identifier}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={`w-full rounded-xl border bg-white py-3 pl-10 pr-11 text-sm outline-none focus:ring-2 focus:ring-purple-200 ${errors.password
                      ? "border-red-400"
                      : "border-slate-300 focus:border-purple-500"
                      }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPw((value) => !value)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p
                    id="password-error"
                    className="mt-1 text-xs font-medium text-red-600"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Seeded Sandbox Credentials (collapsible) */}
              <details className="group rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600 transition">
                <summary className="cursor-pointer font-semibold text-slate-700 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 rounded px-1 flex items-center justify-between">
                  <span>Sandbox Demo Credentials</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 group-open:hidden">Show</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 hidden group-open:inline">Hide</span>
                </summary>
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1">
                  {role.id === "aicte" && subRole === "ADMIN" && (
                    <p className="font-mono text-purple-700">admin@aicte.gov.in / Admin@123</p>
                  )}
                  {role.id === "aicte" && subRole === "NODAL_OFFICER" && (
                    <p className="font-mono text-purple-700">officer@aicte.gov.in / Officer@123</p>
                  )}
                  {role.id === "institution" && subRole === "INSTITUTION_ADMIN" && (
                    <p className="font-mono text-purple-700">admin@ditm.ac.in (or AICTE-INST-1001) / InstAdmin@123 • gautam@nitp.ac.in / InstAdmin@123</p>
                  )}
                  {role.id === "institution" && subRole === "OPERATOR" && (
                    <p className="font-mono text-purple-700">operator@ditm.ac.in / Operator@123</p>
                  )}
                  {role.id === "verifier" && (
                    <p className="font-mono text-purple-700">verifier@tcs.com / Verifier@123</p>
                  )}
                </div>
              </details>

              {serverError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>

              <p className="text-xs text-slate-500">Press Esc to change role.</p>
            </form>
          </section>
        )}
      </div>

      {showMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h3>
                <p className="text-xs text-slate-500">Enter the 6-digit code from your authenticator app</p>
              </div>
            </div>

            <form onSubmit={handleMfaSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="mfa-code" className="block text-xs font-semibold text-slate-700">
                  6-Digit Security Code
                </label>
                <input
                  id="mfa-code"
                  type="text"
                  maxLength={6}
                  value={mfaOtp}
                  onChange={(e) => setMfaOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="000000"
                  autoFocus
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl font-mono tracking-widest text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              {mfaError && (
                <p className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-700">
                  {mfaError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMfaModal(false);
                    setMfaOtp("");
                    setMfaError("");
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mfaSubmitting || mfaOtp.length !== 6}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {mfaSubmitting ? "Verifying..." : "Verify Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function OfficialsLogin() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </main>
      }
    >
      <OfficialsLoginContent />
    </Suspense>
  );
}

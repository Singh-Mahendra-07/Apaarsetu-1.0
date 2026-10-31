
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Search,
  Unlock,
  X,
  UserPlus,
  Zap,
} from "lucide-react";

type Role = "AICTE OFFICER" | "UNIVERSITY ADMIN";
type Status = "ACTIVE" | "SUSPENDED" | "LOCKED";
type Tab = "all" | "aicte" | "university";

type Official = {
  id: string;
  name: string;
  email: string;
  role: Role;
  scope: string;
  zone?: string;
  institutionId?: string;
  status: Status;
  verified: boolean;
  lastLogin: string;
};

const STATUS_CLS: Record<Status, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  SUSPENDED: "bg-amber-100 text-amber-800",
  LOCKED: "bg-red-100 text-red-700",
};

const ROLE_CLS: Record<Role, string> = {
  "AICTE OFFICER": "bg-indigo-700 text-white",
  "UNIVERSITY ADMIN": "bg-blue-100 text-blue-800",
};

const API_STATUS = (id: string) =>
  `/api/v1/active/officials/${encodeURIComponent(id)}/status`;

const RESET_PASSWORD_ROUTE = "/aicte-admin/user-management/reset-password";

/* ----------------------------- Manage popup actions ----------------------------- */

type ActionKey = "lock" | "unlock" | "suspend" | "activate";

type ManageAction = {
  key: ActionKey;
  label: string;
  target: Status;
  Icon: typeof Lock;
  cls: string;
  disabledReason: (status: Status) => string | null;
  success: (name: string) => string;
};

// Same four controls for both popups; only the "suspend" label changes.
const manageActions = (role: Role): ManageAction[] => [
  {
    key: "lock",
    label: "Lock profile",
    target: "LOCKED",
    Icon: Lock,
    cls: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
    disabledReason: (s) => (s === "LOCKED" ? "Profile is already locked" : null),
    success: (name) => `${name}'s profile has been locked.`,
  },
  {
    key: "unlock",
    label: "Unlock profile",
    target: "ACTIVE",
    Icon: Unlock,
    cls: "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    disabledReason: (s) => (s !== "LOCKED" ? "Profile is not locked" : null),
    success: (name) => `${name}'s profile has been unlocked.`,
  },
  {
    key: "suspend",
    label: role === "AICTE OFFICER" ? "Suspend officer" : "Suspend admin",
    target: "SUSPENDED",
    Icon: Ban,
    cls: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
    disabledReason: (s) =>
      s === "SUSPENDED" ? "Account is already suspended" : null,
    success: (name) => `${name}'s account has been suspended.`,
  },
  {
    key: "activate",
    label: "Activate profile",
    target: "ACTIVE",
    Icon: CheckCircle2,
    cls: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    disabledReason: (s) =>
      s !== "SUSPENDED" ? "Only suspended accounts can be activated" : null,
    success: (name) => `${name}'s account has been activated.`,
  },
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiUp, setApiUp] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | Role>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [selectedId, setSelectedId] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  // Manage popup state
  const [managedId, setManagedId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null);
  const [actionError, setActionError] = useState("");

  const manageTriggerRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const managed = useMemo(
    () => users.find((u) => u.id === managedId) ?? null,
    [users, managedId]
  );

  // Registration form state
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("UNIVERSITY ADMIN");
  const [newScope, setNewScope] = useState("");
  const [newInstitutionId, setNewInstitutionId] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => {
        if (active) setApiUp(r.ok);
      })
      .catch(() => {
        if (active) setApiUp(false);
      });

    (async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("apaarsetu_access_token")
            : null;
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const res = await fetch("/api/v1/active/officials", {
          cache: "no-store",
          headers,
        });

        if (res.ok) {
          const json = (await res.json()) as Official[];
          if (!active) return;

          if (json.length) {
            setUsers(json);
            setSelectedId(json[0].id);
          }
          setApiUp(true);
        } else if (res.status === 401 || res.status === 403) {
          // API on port 8081 is reachable and rejected unauthenticated request
          if (active) setApiUp(true);
        }
      } catch {
        // Network connection error
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Close registration form with Escape
  useEffect(() => {
    if (!showRegisterForm) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowRegisterForm(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showRegisterForm]);

  /* ----------------------------- Manage popup handlers ----------------------------- */

  const openManage = (user: Official, trigger: HTMLElement) => {
    manageTriggerRef.current = trigger;
    setSelectedId(user.id);
    setActionError("");
    setPendingAction(null);
    setManagedId(user.id);
  };

  const closeManage = useCallback(() => {
    setManagedId(null);
    setActionError("");
    setTimeout(() => manageTriggerRef.current?.focus(), 0);
  }, []);

  // Escape closes the popup (not while a request is running); focus the close button on open.
  useEffect(() => {
    if (!managedId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pendingAction) closeManage();
    };

    window.addEventListener("keydown", onKeyDown);
    closeBtnRef.current?.focus();

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [managedId, pendingAction, closeManage]);

  const goResetPassword = (user: Official) => {
    const params = new URLSearchParams({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    router.push(`${RESET_PASSWORD_ROUTE}?${params.toString()}`);
  };

  // Status changes are real writes: if the server fails, show the error and change nothing.
  const changeStatus = async (user: Official, action: ManageAction) => {
    if (pendingAction) return;

    setActionError("");
    setPendingAction(action.key);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("apaarsetu_access_token")
          : null;
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let res = await fetch(API_STATUS(user.id), {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: action.target }),
      });

      if (res.status === 404) {
        const fallbackRes = await fetch(
          `/api/v1/admin/users/${encodeURIComponent(user.id)}/status`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: action.target }),
          }
        );
        if (fallbackRes.ok) {
          res = fallbackRes;
        }
      }

      if (!res.ok) {
        let message = `Request failed (HTTP ${res.status}). Nothing was changed.`;

        try {
          const body = await res.json();
          if (body?.message) message = String(body.message);
        } catch {
          // Response was not JSON.
        }

        setActionError(message);
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, status: action.target } : u
        )
      );
      setToast(action.success(user.name));
    } catch {
      setApiUp(false);
      setActionError(
        "Can't reach the server on port 8081. Nothing was changed."
      );
    } finally {
      setPendingAction(null);
    }
  };

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "ACTIVE").length,
      aicte: users.filter((u) => u.role === "AICTE OFFICER").length,
      university: users.filter((u) => u.role === "UNIVERSITY ADMIN").length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((u) => {
      if (tab === "aicte" && u.role !== "AICTE OFFICER") return false;
      if (tab === "university" && u.role !== "UNIVERSITY ADMIN") return false;
      if (roleFilter !== "All" && u.role !== roleFilter) return false;
      if (statusFilter !== "All" && u.status !== statusFilter) return false;
      if (!q) return true;

      return [u.name, u.email, u.scope, u.institutionId ?? ""].some((v) =>
        v.toLowerCase().includes(q)
      );
    });
  }, [users, tab, query, roleFilter, statusFilter]);

  const setStatus = async (id: string, status: Status, message: string) => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("apaarsetu_access_token")
          : null;
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let res = await fetch(API_STATUS(id), {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        res = await fetch(`/api/v1/admin/users/${encodeURIComponent(id)}/status`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status }),
        });
      }

      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
        setToast(message);
      } else {
        setToast("Failed to update status on server.");
      }
    } catch {
      setToast("Error communicating with server.");
    }
  };

  const registerUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = newEmail.trim().toLowerCase();

    if (
      users.some((user) => user.email.toLowerCase() === normalizedEmail)
    ) {
      setToast("A user with this email address already exists.");
      return;
    }

    const user: Official = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: normalizedEmail,
      role: newRole,
      scope: newScope.trim(),
      ...(newRole === "AICTE OFFICER"
        ? { zone: newScope.trim() }
        : { institutionId: newInstitutionId.trim() }),
      status: "ACTIVE",
      verified: false,
      lastLogin: "Never",
    };

    setUsers((previous) => [...previous, user]);
    setSelectedId(user.id);
    setTab("all");
    setRoleFilter("All");
    setStatusFilter("All");
    setQuery("");

    setNewName("");
    setNewEmail("");
    setNewRole("UNIVERSITY ADMIN");
    setNewScope("");
    setNewInstitutionId("");
    setShowRegisterForm(false);
    setToast(`${user.name} has been added to the user list.`);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900">
      {/* White top navbar */}
      <header className="flex min-h-[104px] w-full flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap className="h-6 w-6" />
          </div>

          <div className="min-w-0 leading-tight">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              System Administration
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              User Management
            </p>
            <Link
              href="/aicte-admin"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 transition hover:text-indigo-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Central Dashboard
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:flex sm:text-sm ${apiUp
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${apiUp ? "bg-emerald-500" : "bg-red-500"
                }`}
            />
            {apiUp
              ? "API Connected (Port 8081)"
              : "API Unreachable (Port 8081)"}
          </span>
        </div>
      </header>

      {/* Full-width page content */}
      <main className="w-full px-4 py-6 sm:px-6 lg:px-8 2xl:px-10">
        {/* Register button below navbar */}
        <div className="mb-6 flex justify-end">
          <Link
            href="/aicte-admin/user-management/register"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <UserPlus className="h-4 w-4" />
            Register New User
          </Link>
        </div>



        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              User &amp; Nodal Officer Management
            </h1>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              Assign, monitor, and regulate AICTE Regional Nodal Officers and
              University/College Admins.
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            title="Total Officials"
            value={loading ? "..." : String(stats.total)}
            note="Registered platform users"
          />
          <Stat
            title="Active Officials"
            value={loading ? "..." : String(stats.active)}
            note="Accounts currently active"
          />
          <Stat
            title="AICTE Regional Officers"
            value={loading ? "..." : String(stats.aicte)}
            note="Zone officers"
          />
          <Stat
            title="University Admins"
            value={loading ? "..." : String(stats.university)}
            note="College administrators"
          />
        </section>

        {/* Official accounts table */}
        <section className="mt-6 w-full rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Official Accounts</h2>
              <p className="mt-1 text-sm text-slate-500">
                Select an official to manage their account status.
              </p>
            </div>

            <div className="flex flex-wrap gap-2" role="tablist">
              {(
                [
                  { key: "all", label: "All Officials" },
                  { key: "aicte", label: "AICTE Officers" },
                  { key: "university", label: "University Admins" },
                ] as { key: Tab; label: string }[]
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.key}
                  onClick={() => setTab(item.key)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${tab === item.key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search and filters */}
          <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_220px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, region or AICTE ID..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <FilterSelect
              label="Filter by role"
              value={roleFilter}
              onChange={(v) => setRoleFilter(v as "All" | Role)}
              options={["All", "AICTE OFFICER", "UNIVERSITY ADMIN"]}
            />

            <FilterSelect
              label="Filter by status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as "All" | Status)}
              options={["All", "ACTIVE", "SUSPENDED", "LOCKED"]}
            />
          </div>

          {/* Only five visible columns: no Verified or Last Login */}
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[800px] table-auto text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-4 font-semibold">User Details</th>
                  <th className="px-4 py-4 font-semibold">Platform Role</th>
                  <th className="px-4 py-4 font-semibold">Assigned Scope</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        <span>Loading registered officials...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      No officials match these filters. Clear the search or
                      change a filter.
                    </td>
                  </tr>
                ) : null}

                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedId(u.id)}
                    className={`cursor-pointer border-t border-slate-200 transition ${u.id === selectedId
                        ? "bg-indigo-50"
                        : "hover:bg-slate-50"
                      }`}
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{u.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{u.email}</p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${ROLE_CLS[u.role]}`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="max-w-[360px] px-4 py-4 text-slate-700">
                      <span className="line-clamp-2">{u.scope}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[u.status]}`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {u.status !== "ACTIVE" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatus(
                                u.id,
                                "ACTIVE",
                                `${u.name} account activated.`
                              );
                            }}
                            className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            Activate
                          </button>
                        )}

                        {u.status !== "SUSPENDED" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatus(
                                u.id,
                                "SUSPENDED",
                                `${u.name} account suspended.`
                              );
                            }}
                            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          type="button"
                          aria-haspopup="dialog"
                          aria-label={`Manage ${u.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openManage(u, e.currentTarget);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Manage <Zap className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>
              Showing {filtered.length} of {users.length} officials
            </span>
            <span>
              {apiUp
                ? "Connected to officials API"
                : "API unavailable"}
            </span>
          </div>
        </section>
      </main>

      {/* Register New User modal */}
      {showRegisterForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowRegisterForm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-user-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6">
              <div>
                <h2
                  id="register-user-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Register New User
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the new official's account details.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close registration form"
                onClick={() => setShowRegisterForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={registerUser} className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="new-user-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="new-user-name"
                  required
                  minLength={2}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label
                  htmlFor="new-user-email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="new-user-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label
                  htmlFor="new-user-role"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Platform Role
                </label>
                <select
                  id="new-user-role"
                  value={newRole}
                  onChange={(e) => {
                    const role = e.target.value as Role;
                    setNewRole(role);
                    setNewScope("");
                    setNewInstitutionId("");
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="AICTE OFFICER">AICTE Officer</option>
                  <option value="UNIVERSITY ADMIN">University Admin</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="new-user-scope"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  {newRole === "AICTE OFFICER"
                    ? "Assigned Zone"
                    : "Institution Name / Assigned Scope"}
                </label>
                <input
                  id="new-user-scope"
                  required
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  placeholder={
                    newRole === "AICTE OFFICER"
                      ? "e.g. NORTH ZONE"
                      : "Enter institution name"
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {newRole === "UNIVERSITY ADMIN" && (
                <div>
                  <label
                    htmlFor="new-user-institution-id"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Institution ID
                  </label>
                  <input
                    id="new-user-institution-id"
                    required
                    value={newInstitutionId}
                    onChange={(e) => setNewInstitutionId(e.target.value)}
                    placeholder="e.g. AICTE-INST-1001"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Register User
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Manage popup */}
      {managed && (
        <ManageDialog
          user={managed}
          pendingAction={pendingAction}
          error={actionError}
          closeRef={closeBtnRef}
          onClose={() => {
            if (!pendingAction) closeManage();
          }}
          onAction={(action) => changeStatus(managed, action)}
          onResetPassword={() => goResetPassword(managed)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Manage dialog ----------------------------- */

function ManageDialog({
  user,
  pendingAction,
  error,
  closeRef,
  onClose,
  onAction,
  onResetPassword,
}: {
  user: Official;
  pendingAction: ActionKey | null;
  error: string;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onAction: (action: ManageAction) => void;
  onResetPassword: () => void;
}) {
  const isOfficer = user.role === "AICTE OFFICER";
  const actions = manageActions(user.role);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Top: name and email */}
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                System Administration
              </p>
              <h2
                id="manage-title"
                className="mt-0.5 text-lg font-bold text-slate-900"
              >
                {isOfficer ? "Manage AICTE Officer" : "Manage University Admin"}
              </h2>
            </div>

            <button
              ref={closeRef}
              type="button"
              aria-label="Close manage popup"
              onClick={onClose}
              disabled={pendingAction !== null}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Name</dt>
              <dd className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Email</dt>
              <dd className="truncate text-sm font-semibold text-slate-900">
                {user.email}
              </dd>
            </div>

            <div className="min-w-0 sm:col-span-2">
              <dt className="text-xs text-slate-500">
                {isOfficer ? "Zone" : "Institution"}
              </dt>
              <dd className="text-sm text-slate-700">
                {isOfficer ? user.zone ?? user.scope : user.scope}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${ROLE_CLS[user.role]}`}
            >
              {user.role}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[user.status]}`}
            >
              {user.status}
            </span>
          </div>
        </div>

        {/* Bottom: the four controls */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => {
              const reason = action.disabledReason(user.status);
              const busy = pendingAction === action.key;
              const disabled = reason !== null || pendingAction !== null;

              return (
                <button
                  key={action.key}
                  type="button"
                  disabled={disabled}
                  title={reason ?? undefined}
                  onClick={() => onAction(action)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${action.cls}`}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <action.Icon className="h-4 w-4" />
                  )}
                  {action.label}
                </button>
              );
            })}

            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={onResetPassword}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-600 bg-indigo-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <KeyRound className="h-4 w-4" />
              Reset password
            </button>
          </div>

          <div role="alert" aria-live="assertive">
            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
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
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? label : option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

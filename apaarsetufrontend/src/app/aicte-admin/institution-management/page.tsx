
// // // export default function InstitutionManagementPage() {
// // //   return (
// // //     <div className="p-8">
// // //       <p className="text-sm font-semibold text-violet-600">
// // //         PLATFORM CONTROL
// // //       </p>

// // //       <h1 className="mt-2 text-3xl font-bold text-slate-900">
// // //         Institution Management
// // //       </h1>

// // //       <p className="mt-2 text-slate-500">
// // //         Manage AICTE-approved institutions, sanctioned
// // //         programs, approved intake and student enrollment.
// // //       </p>

// // //       <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
// // //         <h2 className="text-xl font-semibold">
// // //           Registered Institutions
// // //         </h2>

// // //         <p className="mt-2 text-sm text-slate-500">
// // //           Institution records and management tools will
// // //           appear here.
// // //         </p>

// // //         <button className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-white">
// // //           Add Institution
// // //         </button>
// // //       </div>
// // //     </div>
// // //   );
// // // }


// // // // -------------------
// // // // import Link from "next/link";
// // // // <Link
// // // //   href="/aicte-admin/institutions/add"
// // // //   className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
// // // // >
// // // //   + Add Institution
// // // // </Link>

// // // --------------------
// // import Link from "next/link";

// // export default function InstitutionManagementPage() {
// //   return (
// //     <div className="p-8">
// //       <p className="text-sm font-semibold text-violet-600">
// //         PLATFORM CONTROL
// //       </p>

// //       <h1 className="mt-2 text-3xl font-bold text-slate-900">
// //         Institution Management
// //       </h1>

// //       <p className="mt-2 text-slate-500">
// //         Manage AICTE-approved institutions, sanctioned
// //         programs, approved intake and student enrollment.
// //       </p>

// //       <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
// //         <h2 className="text-xl font-semibold">
// //           Registered Institutions
// //         </h2>

// //         <p className="mt-2 text-sm text-slate-500">
// //           Institution records and management tools will
// //           appear here.
// //         </p>

// //         <Link
// //           href="/aicte-admin/instituition/add"
// //           className="mt-5 inline-block rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700"
// //         >
// //           Add Institution
// //         </Link>
// //       </div>
// //     </div>
// //   );
// // }
// // --------------------------------------------------
// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import { ArrowLeft, ArrowRight, Bell, Building2, ChevronDown, Plus, Search, X } from "lucide-react";

// /* -------------------------------- Types -------------------------------- */

// type Category = "ENGINEERING" | "PGDM";
// type Status = "APPROVED" | "SUSPENDED" | "REVOKED";

// type Quotas = { ews: number; nri: number; tfw: number; pmsss: number; ocifn: number };

// type Program = {
//   code: string;
//   name: string;
//   level: "UG" | "PG";
//   intake: number; // sanctioned (regular) intake cap
//   quotas: Quotas;
// };

// type Institution = {
//   id: string;
//   aicteId: string;
//   name: string;
//   category: Category;
//   zone: string;
//   state: string;
//   city: string;
//   affiliation: string;
//   status: Status;
//   programs: Program[];
// };

// const NO_QUOTAS: Quotas = { ews: 0, nri: 0, tfw: 0, pmsss: 0, ocifn: 0 };

// /* ------------------------------ Sample data ------------------------------ */
// // Replace with GET /api/v1/institutions; shown only if the API is unreachable.

// const NIAT = "National Institute of Advanced Technology";

// const SAMPLE: Institution[] = [
//   {
//     id: "i1", aicteId: "AICTE-INST-1001", name: "Delhi Institute of Technology & Management",
//     category: "ENGINEERING", zone: "NORTH", state: "Delhi", city: "New Delhi",
//     affiliation: "Delhi Technological University", status: "APPROVED",
//     programs: [
//       { code: "CS", name: "B.Tech Computer Science (CS)", level: "UG", intake: 120, quotas: { ews: 12, nri: 6, tfw: 6, pmsss: 2, ocifn: 0 } },
//     ],
//   },
//   {
//     id: "i2", aicteId: "AICTE-INST-2002", name: "Bengaluru Premier Business Academy",
//     category: "PGDM", zone: "SOUTH", state: "Karnataka", city: "Bengaluru",
//     affiliation: "AICTE Central", status: "APPROVED",
//     programs: [{ code: "PGDM", name: "PGDM (Management)", level: "PG", intake: 60, quotas: { ...NO_QUOTAS, ews: 6, nri: 3 } }],
//   },
//   { id: "i3", aicteId: "AICTE-TEST-1950", name: NIAT, category: "ENGINEERING", zone: "NORTH", state: "Delhi", city: "New Delhi", affiliation: "AICTE Central", status: "APPROVED", programs: [] },
//   { id: "i4", aicteId: "AICTE-TEST-3063", name: `${NIAT} (Updated)`, category: "ENGINEERING", zone: "NORTH", state: "Delhi", city: "New Delhi", affiliation: "AICTE Central", status: "APPROVED", programs: [] },
//   { id: "i5", aicteId: "AICTE-TEST-5412", name: `${NIAT} (Updated)`, category: "ENGINEERING", zone: "NORTH", state: "Delhi", city: "New Delhi", affiliation: "AICTE Central", status: "APPROVED", programs: [] },
//   { id: "i6", aicteId: "AICTE-TEST-5014", name: `${NIAT} (Updated)`, category: "ENGINEERING", zone: "NORTH", state: "Delhi", city: "New Delhi", affiliation: "AICTE Central", status: "APPROVED", programs: [] },
//   { id: "i7", aicteId: "AICTE-TEST-7782", name: `${NIAT} (Updated)`, category: "ENGINEERING", zone: "NORTH", state: "Delhi", city: "New Delhi", affiliation: "AICTE Central", status: "APPROVED", programs: [] },
// ];

// const ZONES = ["NORTH", "SOUTH", "WEST", "EAST", "CENTRAL"];

// const STATUS_CLS: Record<Status, { badge: string; dot: string; active: string }> = {
//   APPROVED: { badge: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500", active: "border-emerald-500 bg-emerald-50 text-emerald-800" },
//   SUSPENDED: { badge: "bg-amber-50 text-amber-800", dot: "bg-amber-500", active: "border-amber-500 bg-amber-50 text-amber-800" },
//   REVOKED: { badge: "bg-red-50 text-red-700", dot: "bg-red-500", active: "border-red-500 bg-red-50 text-red-700" },
// };

// const inputCls =
//   "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

// const totalIntake = (i: Institution) => i.programs.reduce((s, p) => s + p.intake, 0);

// /* --------------------------------- Page --------------------------------- */

// export default function InstitutionsPage() {
//   const [items, setItems] = useState<Institution[]>(SAMPLE);
//   const [apiUp, setApiUp] = useState(true);
//   const [query, setQuery] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState<"All" | Category>("All");
//   const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
//   const [selectedId, setSelectedId] = useState<string | null>(SAMPLE[0].id);
//   const [registerOpen, setRegisterOpen] = useState(false);
//   const [intakeFor, setIntakeFor] = useState<string | null>(null); // institution id
//   const [toast, setToast] = useState<string | null>(null);

//   const load = useCallback(async () => {
//     try {
//       const res = await fetch("/api/v1/institutions?page=0", { cache: "no-store" });
//       if (!res.ok) throw new Error(String(res.status));
//       const json = (await res.json()) as Institution[];
//       setItems(json);
//       setSelectedId(json[0]?.id ?? null);
//       setApiUp(true);
//     } catch {
//       setApiUp(false);
//     }
//   }, []);

//   useEffect(() => {
//     load();
//   }, [load]);

//   useEffect(() => {
//     if (!toast) return;
//     const t = setTimeout(() => setToast(null), 3000);
//     return () => clearTimeout(t);
//   }, [toast]);

//   // Tries the API; the page state is updated either way so the flow can be tried offline.
//   const sync = async (method: "POST" | "PUT", url: string, body: unknown) => {
//     try {
//       const res = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       });
//       return res.ok;
//     } catch {
//       return false;
//     }
//   };

//   const stats = useMemo(
//     () => ({
//       active: items.filter((i) => i.status === "APPROVED").length,
//       seats: items.reduce((s, i) => s + totalIntake(i), 0),
//       engineering: items.filter((i) => i.category === "ENGINEERING").length,
//       pgdm: items.filter((i) => i.category === "PGDM").length,
//     }),
//     [items]
//   );

//   const rows = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     return items.filter((i) => {
//       if (categoryFilter !== "All" && i.category !== categoryFilter) return false;
//       if (statusFilter !== "All" && i.status !== statusFilter) return false;
//       return (
//         !q ||
//         [i.name, i.aicteId, i.city, i.state].some((v) => v.toLowerCase().includes(q))
//       );
//     });
//   }, [items, query, categoryFilter, statusFilter]);

//   const selected = items.find((i) => i.id === selectedId) ?? null;
//   const intakeTarget = items.find((i) => i.id === intakeFor) ?? null;

//   const changeStatus = async (inst: Institution, status: Status) => {
//     if (inst.status === status) return;
//     setItems((prev) => prev.map((i) => (i.id === inst.id ? { ...i, status } : i)));
//     const ok = await sync("PUT", `/api/v1/institutions/${inst.id}`, { status });
//     setToast(`${inst.name} marked ${status.toLowerCase()}.${ok ? "" : " Not synced: API unreachable."}`);
//   };

//   const saveIntake = async (inst: Institution, code: string, intake: number, quotas: Quotas) => {
//     setItems((prev) =>
//       prev.map((i) =>
//         i.id === inst.id
//           ? { ...i, programs: i.programs.map((p) => (p.code === code ? { ...p, intake, quotas } : p)) }
//           : i
//       )
//     );
//     setIntakeFor(null);
//     const ok = await sync(
//       "PUT",
//       `/api/v1/institutions/${inst.id}/intake?programCode=${encodeURIComponent(code)}&academicYear=2026-27`,
//       { intake, quotas }
//     );
//     setToast(`Intake updated for ${code}.${ok ? "" : " Not synced: API unreachable."}`);
//   };

//   const register = async (inst: Institution) => {
//     setItems((prev) => [inst, ...prev]);
//     setSelectedId(inst.id);
//     setRegisterOpen(false);
//     const ok = await sync("POST", "/api/v1/institutions", inst);
//     setToast(`${inst.name} registered.${ok ? "" : " Not synced: API unreachable."}`);
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-900">
//       {/* ------------------------------ Top bar ------------------------------ */}
//       <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
//         <div>
//           <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
//             System Administration
//           </p>
//           <h2 className="text-xl font-bold">Central Control Center</h2>
//         </div>
//         <div className="flex items-center gap-4">
//           <span
//             className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
//               apiUp
//                 ? "border-emerald-200 bg-emerald-50 text-emerald-700"
//                 : "border-red-200 bg-red-50 text-red-700"
//             }`}
//           >
//             <span className={`h-2 w-2 rounded-full ${apiUp ? "bg-emerald-500" : "bg-red-500"}`} />
//             {apiUp ? "API Connected (Port 8081)" : "API Unreachable (Port 8081)"}
//           </span>
//           {/* <button
//             aria-label="Notifications"
//             className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
//           >
//             <Bell className="h-5 w-5" />
//             <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
//               1
//             </span>
//           </button> */}
//         </div>
//       </header>

//       <main className="mx-auto max-w-[1500px] px-8 py-6">
//         <Link
//           href="/aicte-admin"
//           className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
//         >
//           <ArrowLeft className="h-4 w-4" /> Back to Central Dashboard
//         </Link>

//         <div className="mt-4 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
//           {/* ---------------------------- Left column ---------------------------- */}
//           <div className="min-w-0">
//             <div className="flex items-center gap-4">
//               <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
//                 <Building2 className="h-7 w-7" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold tracking-tight">Institution Management</h1>
//                 <p className="text-slate-600">
//                   Manage technical institutions, sanctioned degree programs, and approved intake
//                   capacities.
//                 </p>
//               </div>
//             </div>

//             <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//               <Stat title="Total Institutions" value={`${items.length} (Active)`} note={`${stats.active} approved`} />
//               <Stat title="Total Approved Seats" value={`${stats.seats} seats`} note="Aggregated from MongoDB" />
//               <Stat title="Engineering Colleges" value={`${stats.engineering} colleges`} note="Category: ENGINEERING" />
//               <Stat title="Management Academies" value={`${stats.pgdm} PGDM`} note="Category: PGDM/MBA" />
//             </section>

//             {/* Filters */}
//             <div className="mt-5 flex flex-wrap gap-3">
//               <div className="relative min-w-[260px] flex-1">
//                 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                 <input
//                   value={query}
//                   onChange={(e) => setQuery(e.target.value)}
//                   placeholder="Search college name, ID, city, or state..."
//                   className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
//                 />
//               </div>
//               <Select
//                 label="All Categories"
//                 value={categoryFilter}
//                 onChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
//                 options={["All", "ENGINEERING", "PGDM"]}
//               />
//               <Select
//                 label="All Statuses"
//                 value={statusFilter}
//                 onChange={(v) => setStatusFilter(v as typeof statusFilter)}
//                 options={["All", "APPROVED", "SUSPENDED", "REVOKED"]}
//               />
//               <button
//                 onClick={() => setRegisterOpen(true)}
//                 className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
//               >
//                 <Plus className="h-4 w-4" /> Register New Institution
//               </button>
//             </div>

//             {/* Table */}
//             <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
//               <table className="w-full min-w-[900px] text-left text-sm">
//                 <thead className="bg-slate-50 font-semibold">
//                   <tr>
//                     <th className="px-4 py-3">AICTE ID</th>
//                     <th className="px-4 py-3">Institution Name</th>
//                     <th className="px-4 py-3">Type</th>
//                     <th className="px-4 py-3">State / City</th>
//                     <th className="px-4 py-3">Affiliation</th>
//                     <th className="px-4 py-3">Status</th>
//                     <th className="px-4 py-3">Approved Intake</th>
//                     <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {rows.length === 0 && (
//                     <tr>
//                       <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
//                         No institutions match these filters. Clear the search or change a filter.
//                       </td>
//                     </tr>
//                   )}
//                   {rows.map((i) => (
//                     <tr
//                       key={i.id}
//                       onClick={() => setSelectedId(i.id)}
//                       className={`cursor-pointer border-t border-slate-200 ${
//                         i.id === selectedId ? "bg-indigo-50" : "hover:bg-slate-50"
//                       }`}
//                     >
//                       <td className="max-w-[110px] px-4 py-3 font-medium text-indigo-700">{i.aicteId}</td>
//                       <td className="max-w-[240px] px-4 py-3">{i.name}</td>
//                       <td className="px-4 py-3">{i.category}</td>
//                       <td className="px-4 py-3">
//                         {i.city}, {i.state}
//                       </td>
//                       <td className="max-w-[170px] px-4 py-3">{i.affiliation}</td>
//                       <td className="px-4 py-3">
//                         <span
//                           className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[i.status].badge}`}
//                         >
//                           <span className={`h-2 w-2 rounded-full ${STATUS_CLS[i.status].dot}`} />
//                           {i.status}
//                         </span>
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 font-bold">{totalIntake(i)} seats</td>
//                       <td className="px-4 py-3">
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             setSelectedId(i.id);
//                           }}
//                           className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-indigo-700 hover:underline"
//                         >
//                           Manage <ArrowRight className="h-4 w-4" />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* --------------------------- Right: details --------------------------- */}
//           <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
//             <h3 className="font-bold">Institution Details &amp; Quota Management</h3>

//             {!selected ? (
//               <p className="mt-6 text-sm text-slate-500">
//                 Select an institution from the table to see its programs and quotas.
//               </p>
//             ) : (
//               <>
//                 <h4 className="mt-5 text-xl font-bold leading-snug">{selected.name}</h4>
//                 <p className="text-slate-600">{selected.aicteId}</p>

//                 <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Institution status">
//                   {(["APPROVED", "SUSPENDED", "REVOKED"] as Status[]).map((s) => (
//                     <button
//                       key={s}
//                       onClick={() => changeStatus(selected, s)}
//                       aria-pressed={selected.status === s}
//                       className={`rounded-md border px-2 py-1.5 text-xs font-semibold ${
//                         selected.status === s
//                           ? STATUS_CLS[s].active
//                           : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
//                       }`}
//                     >
//                       {s}
//                     </button>
//                   ))}
//                 </div>

//                 <div className="mt-5 rounded-lg border border-slate-200">
//                   <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-slate-200 px-4 py-2.5 text-sm font-semibold">
//                     <span>Programs</span>
//                     <span>Intake cap</span>
//                     <span>Quota detail</span>
//                   </div>

//                   {selected.programs.length === 0 && (
//                     <p className="px-4 py-6 text-center text-sm text-slate-500">
//                       No programs sanctioned yet.
//                     </p>
//                   )}

//                   {selected.programs.map((p) => (
//                     <div key={p.code} className="border-b border-slate-200 px-4 py-3 last:border-0">
//                       <div className="flex justify-between gap-3 text-sm">
//                         <span>{p.name}</span>
//                         <span className="font-medium">{p.intake}</span>
//                       </div>
//                       <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
//                         {(
//                           [
//                             ["EWS", p.quotas.ews],
//                             ["NRI", p.quotas.nri],
//                             ["TFW", p.quotas.tfw],
//                             ["PMSSS", p.quotas.pmsss],
//                           ] as const
//                         ).map(([k, v]) => (
//                           <div key={k} className="rounded-md bg-slate-100 py-2">
//                             <p className="text-xs text-slate-600">{k}</p>
//                             <p className="font-semibold">{v}</p>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <button
//                   onClick={() => setIntakeFor(selected.id)}
//                   disabled={selected.programs.length === 0}
//                   className="mt-4 w-full rounded-lg border border-indigo-600 bg-white py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   Update Intake Capacity
//                 </button>
//               </>
//             )}
//           </aside>
//         </div>
//       </main>

//       {registerOpen && (
//         <RegisterModal onClose={() => setRegisterOpen(false)} onSubmit={register} onError={setToast} />
//       )}
//       {intakeTarget && (
//         <IntakeModal
//           institution={intakeTarget}
//           onClose={() => setIntakeFor(null)}
//           onSave={(code, intake, quotas) => saveIntake(intakeTarget, code, intake, quotas)}
//         />
//       )}

//       {toast && (
//         <div
//           role="status"
//           className="fixed bottom-6 left-1/2 z-50 max-w-lg -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg"
//         >
//           {toast}
//         </div>
//       )}
//     </div>
//   );
// }

// /* ------------------------------ Register modal ------------------------------ */

// function RegisterModal({
//   onClose,
//   onSubmit,
//   onError,
// }: {
//   onClose: () => void;
//   onSubmit: (i: Institution) => void;
//   onError: (msg: string) => void;
// }) {
//   const [f, setF] = useState({
//     aicteId: "", name: "", affiliation: "", category: "ENGINEERING" as Category,
//     zone: "NORTH", state: "", city: "",
//     code: "", programName: "", level: "UG" as "UG" | "PG", intake: "",
//     ews: "", nri: "", tfw: "", pmsss: "", ocifn: "",
//   });
//   const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
//     setF({ ...f, [k]: e.target.value });
//   const n = (v: string) => Math.max(0, parseInt(v, 10) || 0);

//   const submit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!f.aicteId.trim() || !f.name.trim() || !f.state.trim() || !f.city.trim()) {
//       onError("Enter the AICTE ID, college name, state and city.");
//       return;
//     }
//     const hasProgram = f.code.trim() && f.programName.trim();
//     onSubmit({
//       id: `i${Date.now()}`,
//       aicteId: f.aicteId.trim(),
//       name: f.name.trim(),
//       category: f.category,
//       zone: f.zone,
//       state: f.state.trim(),
//       city: f.city.trim(),
//       affiliation: f.affiliation.trim() || "AICTE Central",
//       status: "APPROVED",
//       programs: hasProgram
//         ? [
//             {
//               code: f.code.trim(),
//               name: f.programName.trim(),
//               level: f.level,
//               intake: n(f.intake),
//               quotas: { ews: n(f.ews), nri: n(f.nri), tfw: n(f.tfw), pmsss: n(f.pmsss), ocifn: n(f.ocifn) },
//             },
//           ]
//         : [],
//     });
//   };

//   return (
//     <Modal title="Register New Institution" onClose={onClose} wide>
//       <form onSubmit={submit} className="space-y-4 text-sm">
//         <div className="grid gap-3 sm:grid-cols-3">
//           <Field label="AICTE ID"><input value={f.aicteId} onChange={set("aicteId")} className={inputCls} /></Field>
//           <Field label="College Name"><input value={f.name} onChange={set("name")} className={inputCls} /></Field>
//           <Field label="University Affiliation"><input value={f.affiliation} onChange={set("affiliation")} className={inputCls} /></Field>
//         </div>

//         <div className="grid gap-3 sm:grid-cols-4">
//           <Field label="Category">
//             <select value={f.category} onChange={set("category")} className={inputCls}>
//               <option value="ENGINEERING">Engineering</option>
//               <option value="PGDM">PGDM</option>
//             </select>
//           </Field>
//           <Field label="Zone">
//             <select value={f.zone} onChange={set("zone")} className={inputCls}>
//               {ZONES.map((z) => <option key={z}>{z}</option>)}
//             </select>
//           </Field>
//           <Field label="State"><input value={f.state} onChange={set("state")} className={inputCls} /></Field>
//           <Field label="City"><input value={f.city} onChange={set("city")} className={inputCls} /></Field>
//         </div>

//         <h4 className="pt-1 font-semibold">Initial Academic Program</h4>
//         <div className="grid gap-3 sm:grid-cols-4">
//           <Field label="Program Code"><input value={f.code} onChange={set("code")} className={inputCls} /></Field>
//           <Field label="Program Name"><input value={f.programName} onChange={set("programName")} className={inputCls} /></Field>
//           <Field label="Level">
//             <select value={f.level} onChange={set("level")} className={inputCls}>
//               <option>UG</option>
//               <option>PG</option>
//             </select>
//           </Field>
//           <Field label="Sanctioned Intake">
//             <input type="number" min={0} value={f.intake} onChange={set("intake")} className={inputCls} />
//           </Field>
//         </div>

//         <h4 className="pt-1 font-semibold">Supernumerary Quotas Grid</h4>
//         <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
//           {(["ews", "nri", "tfw", "pmsss", "ocifn"] as const).map((k) => (
//             <Field key={k} label={k === "ocifn" ? "OCI/FN" : k.toUpperCase()}>
//               <input type="number" min={0} value={f[k]} onChange={set(k)} className={inputCls} />
//             </Field>
//           ))}
//         </div>

//         <div className="flex items-center justify-between border-t border-slate-200 pt-4">
//           <span className="text-xs italic text-slate-500">POST /api/v1/institutions</span>
//           <div className="flex gap-3">
//             <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50">
//               Cancel
//             </button>
//             <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
//               Submit Registration
//             </button>
//           </div>
//         </div>
//       </form>
//     </Modal>
//   );
// }

// /* ------------------------------- Intake modal ------------------------------- */

// function IntakeModal({
//   institution,
//   onClose,
//   onSave,
// }: {
//   institution: Institution;
//   onClose: () => void;
//   onSave: (code: string, intake: number, quotas: Quotas) => void;
// }) {
//   const [code, setCode] = useState(institution.programs[0]?.code ?? "");
//   const program = institution.programs.find((p) => p.code === code);
//   const [intake, setIntake] = useState(String(program?.intake ?? 0));
//   const [q, setQ] = useState<Record<keyof Quotas, string>>({
//     ews: String(program?.quotas.ews ?? 0),
//     nri: String(program?.quotas.nri ?? 0),
//     tfw: String(program?.quotas.tfw ?? 0),
//     pmsss: String(program?.quotas.pmsss ?? 0),
//     ocifn: String(program?.quotas.ocifn ?? 0),
//   });

//   const pick = (c: string) => {
//     const p = institution.programs.find((x) => x.code === c);
//     setCode(c);
//     setIntake(String(p?.intake ?? 0));
//     setQ({
//       ews: String(p?.quotas.ews ?? 0), nri: String(p?.quotas.nri ?? 0), tfw: String(p?.quotas.tfw ?? 0),
//       pmsss: String(p?.quotas.pmsss ?? 0), ocifn: String(p?.quotas.ocifn ?? 0),
//     });
//   };
//   const n = (v: string) => Math.max(0, parseInt(v, 10) || 0);

//   return (
//     <Modal title="Update Program Intake" onClose={onClose}>
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           onSave(code, n(intake), { ews: n(q.ews), nri: n(q.nri), tfw: n(q.tfw), pmsss: n(q.pmsss), ocifn: n(q.ocifn) });
//         }}
//         className="space-y-4 text-sm"
//       >
//         <Field label="Program">
//           <select value={code} onChange={(e) => pick(e.target.value)} className={inputCls}>
//             {institution.programs.map((p) => (
//               <option key={p.code} value={p.code}>{p.name}</option>
//             ))}
//           </select>
//         </Field>
//         <Field label="Regular Seats">
//           <input type="number" min={0} value={intake} onChange={(e) => setIntake(e.target.value)} className={inputCls} />
//         </Field>
//         <fieldset>
//           <legend className="mb-1 font-medium">Quota Seats</legend>
//           <div className="grid grid-cols-3 gap-3">
//             {(["ews", "nri", "tfw", "pmsss", "ocifn"] as const).map((k) => (
//               <label key={k} className="block">
//                 <span className="mb-1 block text-xs text-slate-600">{k === "ocifn" ? "OCI/FN" : k.toUpperCase()}</span>
//                 <input
//                   type="number"
//                   min={0}
//                   value={q[k]}
//                   onChange={(e) => setQ({ ...q, [k]: e.target.value })}
//                   className={inputCls}
//                 />
//               </label>
//             ))}
//           </div>
//         </fieldset>
//         <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
//           <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50">
//             Cancel
//           </button>
//           <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700">
//             Save
//           </button>
//         </div>
//       </form>
//     </Modal>
//   );
// }

// /* ------------------------------ Small pieces ------------------------------ */

// function Modal({
//   title,
//   onClose,
//   wide,
//   children,
// }: {
//   title: string;
//   onClose: () => void;
//   wide?: boolean;
//   children: React.ReactNode;
// }) {
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [onClose]);

//   return (
//     <div
//       className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
//       onClick={onClose}
//     >
//       <div
//         role="dialog"
//         aria-modal="true"
//         aria-label={title}
//         onClick={(e) => e.stopPropagation()}
//         className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-2xl bg-white p-6 shadow-xl`}
//       >
//         <div className="mb-4 flex items-start justify-between">
//           <h3 className="text-lg font-bold">{title}</h3>
//           <button aria-label="Close" onClick={onClose} className="text-slate-500 hover:text-slate-900">
//             <X className="h-5 w-5" />
//           </button>
//         </div>
//         {children}
//       </div>
//     </div>
//   );
// }

// function Stat({ title, value, note }: { title: string; value: string; note: string }) {
//   return (
//     <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//       <p className="text-slate-800">{title}</p>
//       <p className="text-2xl font-bold">{value}</p>
//       <p className="text-sm text-slate-600">{note}</p>
//     </div>
//   );
// }

// function Field({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <label className="block">
//       <span className="mb-1 block font-medium text-slate-700">{label}</span>
//       {children}
//     </label>
//   );
// }

// function Select({
//   label,
//   value,
//   onChange,
//   options,
// }: {
//   label: string;
//   value: string;
//   onChange: (v: string) => void;
//   options: string[];
// }) {
//   return (
//     <div className="relative">
//       <select
//         aria-label={label}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className="h-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-indigo-500"
//       >
//         {options.map((o) => (
//           <option key={o} value={o}>
//             {o === "All" ? label : o}
//           </option>
//         ))}
//       </select>
//       <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
//     </div>
//   );
// }

// -------------------------------------------------

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  Plus,
  Search,
  X,
} from "lucide-react";

/* -------------------------------- Types -------------------------------- */

type Category = "ENGINEERING" | "PGDM";
type Status = "APPROVED" | "SUSPENDED" | "REVOKED";

type Quotas = {
  ews: number;
  nri: number;
  tfw: number;
  pmsss: number;
  ocifn: number;
};

type Program = {
  code: string;
  name: string;
  level: "UG" | "PG";
  intake: number;
  quotas: Quotas;
};

type Institution = {
  id: string;
  aicteId: string;
  name: string;
  category: Category;
  zone: string;
  state: string;
  city: string;
  affiliation: string;
  status: Status;
  programs: Program[];
};

const NO_QUOTAS: Quotas = {
  ews: 0,
  nri: 0,
  tfw: 0,
  pmsss: 0,
  ocifn: 0,
};

const NIAT = "National Institute of Advanced Technology";

const SAMPLE: Institution[] = [
  {
    id: "i1",
    aicteId: "AICTE-INST-1001",
    name: "Delhi Institute of Technology & Management",
    category: "ENGINEERING",
    zone: "NORTH",
    state: "Delhi",
    city: "New Delhi",
    affiliation: "Delhi Technological University",
    status: "APPROVED",
    programs: [
      {
        code: "CS",
        name: "B.Tech Computer Science (CS)",
        level: "UG",
        intake: 120,
        quotas: {
          ews: 12,
          nri: 6,
          tfw: 6,
          pmsss: 2,
          ocifn: 0,
        },
      },
    ],
  },
  {
    id: "i2",
    aicteId: "AICTE-INST-2002",
    name: "Bengaluru Premier Business Academy",
    category: "PGDM",
    zone: "SOUTH",
    state: "Karnataka",
    city: "Bengaluru",
    affiliation: "AICTE Central",
    status: "APPROVED",
    programs: [
      {
        code: "PGDM",
        name: "PGDM (Management)",
        level: "PG",
        intake: 60,
        quotas: {
          ...NO_QUOTAS,
          ews: 6,
          nri: 3,
        },
      },
    ],
  },
  {
    id: "i3",
    aicteId: "AICTE-TEST-1950",
    name: NIAT,
    category: "ENGINEERING",
    zone: "NORTH",
    state: "Delhi",
    city: "New Delhi",
    affiliation: "AICTE Central",
    status: "APPROVED",
    programs: [],
  },
  {
    id: "i4",
    aicteId: "AICTE-TEST-3063",
    name: `${NIAT} (Updated)`,
    category: "ENGINEERING",
    zone: "NORTH",
    state: "Delhi",
    city: "New Delhi",
    affiliation: "AICTE Central",
    status: "APPROVED",
    programs: [],
  },
  {
    id: "i5",
    aicteId: "AICTE-TEST-5412",
    name: `${NIAT} (Updated)`,
    category: "ENGINEERING",
    zone: "NORTH",
    state: "Delhi",
    city: "New Delhi",
    affiliation: "AICTE Central",
    status: "APPROVED",
    programs: [],
  },
  {
    id: "i6",
    aicteId: "AICTE-TEST-5014",
    name: `${NIAT} (Updated)`,
    category: "ENGINEERING",
    zone: "NORTH",
    state: "Delhi",
    city: "New Delhi",
    affiliation: "AICTE Central",
    status: "APPROVED",
    programs: [],
  },
  {
    id: "i7",
    aicteId: "AICTE-TEST-7782",
    name: `${NIAT} (Updated)`,
    category: "ENGINEERING",
    zone: "NORTH",
    state: "Delhi",
    city: "New Delhi",
    affiliation: "AICTE Central",
    status: "APPROVED",
    programs: [],
  },
];

const ZONES = ["NORTH", "SOUTH", "WEST", "EAST", "CENTRAL"];

const STATUS_CLS: Record<
  Status,
  { badge: string; dot: string; active: string }
> = {
  APPROVED: {
    badge: "bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
    active: "border-emerald-500 bg-emerald-50 text-emerald-800",
  },
  SUSPENDED: {
    badge: "bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    active: "border-amber-500 bg-amber-50 text-amber-800",
  },
  REVOKED: {
    badge: "bg-red-50 text-red-700",
    dot: "bg-red-500",
    active: "border-red-500 bg-red-50 text-red-700",
  },
};

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

const totalIntake = (institution: Institution) =>
  institution.programs.reduce((sum, program) => sum + program.intake, 0);

/* -------------------------------- Page -------------------------------- */

export default function InstitutionsPage() {
  const [items, setItems] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiUp, setApiUp] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | Category>(
    "All"
  );
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");

  // Row selection and detail-panel selection are independent.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manageId, setManageId] = useState<string | null>(null);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [intakeFor, setIntakeFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => setApiUp(r.ok))
      .catch(() => setApiUp(false));

    try {
      const res = await fetch("/api/v1/institutions?page=0", {
        cache: "no-store",
      });

      if (res.ok) {
        const json = (await res.json()) as Institution[];
        setItems(json);
        setSelectedId(null);
        setManageId(null);
        setApiUp(true);
      } else if (res.status === 401 || res.status === 403) {
        setApiUp(true);
      }
    } catch {
      // API cannot be reached.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const sync = async (
    method: "POST" | "PUT",
    url: string,
    body: unknown
  ) => {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      return res.ok;
    } catch {
      return false;
    }
  };

  const stats = useMemo(
    () => ({
      active: items.filter((i) => i.status === "APPROVED").length,
      seats: items.reduce((sum, i) => sum + totalIntake(i), 0),
      engineering: items.filter((i) => i.category === "ENGINEERING").length,
      pgdm: items.filter((i) => i.category === "PGDM").length,
    }),
    [items]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((i) => {
      if (categoryFilter !== "All" && i.category !== categoryFilter)
        return false;

      if (statusFilter !== "All" && i.status !== statusFilter)
        return false;

      return (
        !q ||
        [i.name, i.aicteId, i.city, i.state].some((value) =>
          value.toLowerCase().includes(q)
        )
      );
    });
  }, [items, query, categoryFilter, statusFilter]);

  // Only manageId controls whether the details panel displays an institution.
  const selected = items.find((i) => i.id === manageId) ?? null;
  const intakeTarget = items.find((i) => i.id === intakeFor) ?? null;

  const changeStatus = async (
    institution: Institution,
    status: Status
  ) => {
    if (institution.status === status) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id === institution.id ? { ...i, status } : i
      )
    );

    const ok = await sync(
      "PUT",
      `/api/v1/institutions/${institution.id}`,
      { status }
    );

    setToast(
      `${institution.name} marked ${status.toLowerCase()}.${ok ? "" : " Not synced: API unreachable."}`
    );
  };

  const saveIntake = async (
    institution: Institution,
    code: string,
    intake: number,
    quotas: Quotas
  ) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === institution.id
          ? {
              ...i,
              programs: i.programs.map((p) =>
                p.code === code ? { ...p, intake, quotas } : p
              ),
            }
          : i
      )
    );

    setIntakeFor(null);

    const ok = await sync(
      "PUT",
      `/api/v1/institutions/${institution.id}/intake?programCode=${encodeURIComponent(code)}&academicYear=2026-27`,
      { intake, quotas }
    );

    setToast(
      `Intake updated for ${code}.${ok ? "" : " Not synced: API unreachable."}`
    );
  };

  const register = async (institution: Institution) => {
    setItems((prev) => [institution, ...prev]);
    setSelectedId(institution.id);

    // Do not open the details panel automatically after registration.
    setManageId(null);
    setRegisterOpen(false);

    const ok = await sync(
      "POST",
      "/api/v1/institutions",
      institution
    );

    setToast(
      `${institution.name} registered.${ok ? "" : " Not synced: API unreachable."}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            System Administration
          </p>
          <h2 className="text-xl font-bold">Central Control Center</h2>
        </div>

        <span
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
            apiUp
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              apiUp ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
          {apiUp
            ? "API Connected (Port 8081)"
            : "API Unreachable (Port 8081)"}
        </span>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8">
        <Link
          href="/aicte-admin"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Central Dashboard
        </Link>

        <div className="mt-4 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Left column */}
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Institution Management
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Manage technical institutions, sanctioned degree programs,
                  and approved intake capacities.
                </p>
              </div>
            </div>

            {/* Summary cards */}
            <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                title="Total Institutions"
                value={loading ? "..." : String(items.length)}
                note={`${stats.active} approved`}
              />
              <Stat
                title="Total Approved Seats"
                value={loading ? "..." : `${stats.seats} seats`}
                note="Aggregated from institution data"
              />
              <Stat
                title="Engineering Colleges"
                value={loading ? "..." : String(stats.engineering)}
                note="Category: ENGINEERING"
              />
              <Stat
                title="Management Academies"
                value={loading ? "..." : String(stats.pgdm)}
                note="Category: PGDM"
              />
            </section>

            {/* Search and filters */}
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search college name, ID, city, or state..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <Select
                label="All Categories"
                value={categoryFilter}
                onChange={(value) =>
                  setCategoryFilter(value as typeof categoryFilter)
                }
                options={["All", "ENGINEERING", "PGDM"]}
              />

              <Select
                label="All Statuses"
                value={statusFilter}
                onChange={(value) =>
                  setStatusFilter(value as typeof statusFilter)
                }
                options={["All", "APPROVED", "SUSPENDED", "REVOKED"]}
              />

              <button
                onClick={() => setRegisterOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Register New Institution
              </button>
            </div>

            {/* Institutions table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 font-semibold">
                  <tr>
                    <th className="px-4 py-3">AICTE ID</th>
                    <th className="px-4 py-3">Institution Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">State / City</th>
                    <th className="px-4 py-3">Affiliation</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Approved Intake</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                          <span>Loading institutions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        No institutions match these filters. Clear the search
                        or change a filter.
                      </td>
                    </tr>
                  ) : null}

                  {rows.map((institution) => (
                    <tr
                      key={institution.id}
                      // Clicking the row only highlights it.
                      className={`border-t border-slate-200 ${
                        institution.id === selectedId
                          ? "bg-indigo-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="max-w-[110px] px-4 py-3 font-medium text-indigo-700">
                        {institution.aicteId}
                      </td>

                      <td className="max-w-[240px] px-4 py-3">
                        {institution.name}
                      </td>

                      <td className="px-4 py-3">
                        {institution.category}
                      </td>

                      <td className="px-4 py-3">
                        {institution.city}, {institution.state}
                      </td>

                      <td className="max-w-[170px] px-4 py-3">
                        {institution.affiliation}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[institution.status].badge}`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${STATUS_CLS[institution.status].dot}`}
                          />
                          {institution.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-bold">
                        {totalIntake(institution)} seats
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedId(institution.id);
                            setManageId(institution.id);
                          }}
                          className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-indigo-700 hover:underline"
                          aria-label={`Manage ${institution.name}`}
                        >
                          Manage
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Select Manage on an institution to open its details and quota
              management panel.
            </p>
          </div>

          {/* Right column: details only after clicking Manage */}
          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">
                Institution Details &amp; Quota Management
              </h3>

              {selected && (
                <button
                  onClick={() => setManageId(null)}
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close institution details"
                  title="Close details"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {!selected ? (
              <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-5 text-center">
                <Building2 className="mx-auto h-10 w-10 text-slate-400" />

                <h4 className="mt-3 font-semibold text-slate-800">
                  No Institution Selected
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Click the Manage button next to an institution to view its
                  details, sanctioned programs, intake capacity, and quota
                  information.
                </p>
              </div>
            ) : (
              <>
                <h4 className="mt-5 text-xl font-bold leading-snug">
                  {selected.name}
                </h4>

                <p className="text-sm text-slate-600">
                  {selected.aicteId}
                </p>

                <div
                  className="mt-4 grid grid-cols-3 gap-2"
                  role="group"
                  aria-label="Institution status"
                >
                  {(
                    ["APPROVED", "SUSPENDED", "REVOKED"] as Status[]
                  ).map((status) => (
                    <button
                      key={status}
                      onClick={() => changeStatus(selected, status)}
                      aria-pressed={selected.status === status}
                      className={`rounded-md border px-2 py-1.5 text-xs font-semibold ${
                        selected.status === status
                          ? STATUS_CLS[status].active
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-slate-200 px-4 py-2.5 text-sm font-semibold">
                    <span>Programs</span>
                    <span>Intake cap</span>
                    <span>Quota detail</span>
                  </div>

                  {selected.programs.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">
                      No programs sanctioned yet.
                    </p>
                  )}

                  {selected.programs.map((program) => (
                    <div
                      key={program.code}
                      className="border-b border-slate-200 px-4 py-3 last:border-0"
                    >
                      <div className="flex justify-between gap-3 text-sm">
                        <span>{program.name}</span>
                        <span className="font-medium">
                          {program.intake}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
                        {(
                          [
                            ["EWS", program.quotas.ews],
                            ["NRI", program.quotas.nri],
                            ["TFW", program.quotas.tfw],
                            ["PMSSS", program.quotas.pmsss],
                          ] as const
                        ).map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-md bg-slate-100 py-2"
                          >
                            <p className="text-xs text-slate-600">
                              {label}
                            </p>
                            <p className="font-semibold">{value}</p>
                          </div>
                        ))}
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        OCI/FN quota: {program.quotas.ocifn}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIntakeFor(selected.id)}
                  disabled={selected.programs.length === 0}
                  className="mt-4 w-full rounded-lg border border-indigo-600 bg-white py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Update Intake Capacity
                </button>
              </>
            )}
          </aside>
        </div>
      </main>

      {/* Registration modal */}
      {registerOpen && (
        <RegisterModal
          onClose={() => setRegisterOpen(false)}
          onSubmit={register}
          onError={setToast}
        />
      )}

      {/* Intake modal */}
      {intakeTarget && (
        <IntakeModal
          institution={intakeTarget}
          onClose={() => setIntakeFor(null)}
          onSave={(code, intake, quotas) =>
            saveIntake(intakeTarget, code, intake, quotas)
          }
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 max-w-lg -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Register modal ------------------------------ */

function RegisterModal({
  onClose,
  onSubmit,
  onError,
}: {
  onClose: () => void;
  onSubmit: (institution: Institution) => void;
  onError: (message: string) => void;
}) {
  const [f, setF] = useState({
    aicteId: "",
    name: "",
    affiliation: "",
    category: "ENGINEERING" as Category,
    zone: "NORTH",
    state: "",
    city: "",
    code: "",
    programName: "",
    level: "UG" as "UG" | "PG",
    intake: "",
    ews: "",
    nri: "",
    tfw: "",
    pmsss: "",
    ocifn: "",
  });

  const set = (
    key: keyof typeof f
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const n = (value: string) =>
    Math.max(0, parseInt(value, 10) || 0);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !f.aicteId.trim() ||
      !f.name.trim() ||
      !f.state.trim() ||
      !f.city.trim()
    ) {
      onError("Enter the AICTE ID, college name, state and city.");
      return;
    }

    const hasProgram = Boolean(
      f.code.trim() && f.programName.trim()
    );

    onSubmit({
      id: `i${Date.now()}`,
      aicteId: f.aicteId.trim(),
      name: f.name.trim(),
      category: f.category,
      zone: f.zone,
      state: f.state.trim(),
      city: f.city.trim(),
      affiliation: f.affiliation.trim() || "AICTE Central",
      status: "APPROVED",
      programs: hasProgram
        ? [
            {
              code: f.code.trim(),
              name: f.programName.trim(),
              level: f.level,
              intake: n(f.intake),
              quotas: {
                ews: n(f.ews),
                nri: n(f.nri),
                tfw: n(f.tfw),
                pmsss: n(f.pmsss),
                ocifn: n(f.ocifn),
              },
            },
          ]
        : [],
    });
  };

  return (
    <Modal
      title="Register New Institution"
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="AICTE ID">
            <input
              required
              value={f.aicteId}
              onChange={set("aicteId")}
              className={inputCls}
            />
          </Field>

          <Field label="College Name">
            <input
              required
              value={f.name}
              onChange={set("name")}
              className={inputCls}
            />
          </Field>

          <Field label="University Affiliation">
            <input
              value={f.affiliation}
              onChange={set("affiliation")}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Category">
            <select
              value={f.category}
              onChange={set("category")}
              className={inputCls}
            >
              <option value="ENGINEERING">Engineering</option>
              <option value="PGDM">PGDM</option>
            </select>
          </Field>

          <Field label="Zone">
            <select
              value={f.zone}
              onChange={set("zone")}
              className={inputCls}
            >
              {ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </Field>

          <Field label="State">
            <input
              required
              value={f.state}
              onChange={set("state")}
              className={inputCls}
            />
          </Field>

          <Field label="City">
            <input
              required
              value={f.city}
              onChange={set("city")}
              className={inputCls}
            />
          </Field>
        </div>

        <h4 className="pt-1 font-semibold">
          Initial Academic Program (Optional)
        </h4>

        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Program Code">
            <input
              value={f.code}
              onChange={set("code")}
              className={inputCls}
            />
          </Field>

          <Field label="Program Name">
            <input
              value={f.programName}
              onChange={set("programName")}
              className={inputCls}
            />
          </Field>

          <Field label="Level">
            <select
              value={f.level}
              onChange={set("level")}
              className={inputCls}
            >
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>
          </Field>

          <Field label="Sanctioned Intake">
            <input
              type="number"
              min={0}
              value={f.intake}
              onChange={set("intake")}
              className={inputCls}
            />
          </Field>
        </div>

        <h4 className="pt-1 font-semibold">
          Supernumerary Quotas
        </h4>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            ["ews", "nri", "tfw", "pmsss", "ocifn"] as const
          ).map((key) => (
            <Field
              key={key}
              label={key === "ocifn" ? "OCI/FN" : key.toUpperCase()}
            >
              <input
                type="number"
                min={0}
                value={f[key]}
                onChange={set(key)}
                className={inputCls}
              />
            </Field>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <span className="text-xs italic text-slate-500">
            POST /api/v1/institutions
          </span>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
            >
              Submit Registration
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------- Intake modal ------------------------------- */

function IntakeModal({
  institution,
  onClose,
  onSave,
}: {
  institution: Institution;
  onClose: () => void;
  onSave: (
    code: string,
    intake: number,
    quotas: Quotas
  ) => void;
}) {
  const [code, setCode] = useState(
    institution.programs[0]?.code ?? ""
  );

  const program = institution.programs.find(
    (p) => p.code === code
  );

  const [intake, setIntake] = useState(
    String(program?.intake ?? 0)
  );

  const [q, setQ] = useState<Record<keyof Quotas, string>>({
    ews: String(program?.quotas.ews ?? 0),
    nri: String(program?.quotas.nri ?? 0),
    tfw: String(program?.quotas.tfw ?? 0),
    pmsss: String(program?.quotas.pmsss ?? 0),
    ocifn: String(program?.quotas.ocifn ?? 0),
  });

  const pick = (newCode: string) => {
    const p = institution.programs.find(
      (item) => item.code === newCode
    );

    setCode(newCode);
    setIntake(String(p?.intake ?? 0));
    setQ({
      ews: String(p?.quotas.ews ?? 0),
      nri: String(p?.quotas.nri ?? 0),
      tfw: String(p?.quotas.tfw ?? 0),
      pmsss: String(p?.quotas.pmsss ?? 0),
      ocifn: String(p?.quotas.ocifn ?? 0),
    });
  };

  const n = (value: string) =>
    Math.max(0, parseInt(value, 10) || 0);

  return (
    <Modal title="Update Program Intake" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();

          if (!code) return;

          onSave(code, n(intake), {
            ews: n(q.ews),
            nri: n(q.nri),
            tfw: n(q.tfw),
            pmsss: n(q.pmsss),
            ocifn: n(q.ocifn),
          });
        }}
        className="space-y-4 text-sm"
      >
        <Field label="Program">
          <select
            value={code}
            onChange={(event) => pick(event.target.value)}
            className={inputCls}
          >
            {institution.programs.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Regular Seats">
          <input
            type="number"
            min={0}
            value={intake}
            onChange={(event) => setIntake(event.target.value)}
            className={inputCls}
          />
        </Field>

        <fieldset>
          <legend className="mb-2 font-medium">
            Quota Seats
          </legend>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              ["ews", "nri", "tfw", "pmsss", "ocifn"] as const
            ).map((key) => (
              <Field
                key={key}
                label={
                  key === "ocifn" ? "OCI/FN" : key.toUpperCase()
                }
              >
                <input
                  type="number"
                  min={0}
                  value={q[key]}
                  onChange={(event) =>
                    setQ((prev) => ({
                      ...prev,
                      [key]: event.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </Field>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------ Shared components ------------------------------ */

function Modal({
  title,
  onClose,
  wide,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${
          wide ? "max-w-3xl" : "max-w-md"
        } rounded-2xl bg-white p-6 shadow-xl`}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-bold">{title}</h3>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-800">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{note}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
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
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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

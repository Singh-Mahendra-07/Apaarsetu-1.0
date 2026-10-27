
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Save } from "lucide-react";

export default function AddInstitutionPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    institutionName: "",
    aicteId: "",
    institutionType: "Private",
    universityName: "",
    state: "",
    district: "",
    city: "",
    address: "",
    pincode: "",
    officialEmail: "",
    contactNumber: "",
    website: "",
    principalName: "",
    approvedIntake: "",
    academicYear: "2026-27",
  });

  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const intake = Number(form.approvedIntake);

    if (!Number.isSafeInteger(intake) || intake < 0) {
      setError("Enter a valid non-negative approved intake.");
      return;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }

    if (!/^\d{10}$/.test(form.contactNumber)) {
      setError("Enter a valid 10-digit contact number.");
      return;
    }

    // Frontend demonstration only.
    // Connect this form to your backend POST API to save the record.
    console.log("Institution registration data:", {
      ...form,
      approvedIntake: intake,
    });

    alert("Form validated. Connect the backend API to save the institution.");
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8">
      <Link
        href="/aicte-admin/institution-management"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-600"
      >
        <ArrowLeft size={17} />
        Back to Institution Management
      </Link>

      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
          <Building2 size={28} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
            AICTE Administration
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Add Institution
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter institution details for registration and verification.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-5xl space-y-6"
      >
        {/* Basic information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            1. Basic Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Institution Name">
              <input
                required
                minLength={3}
                maxLength={150}
                name="institutionName"
                value={form.institutionName}
                onChange={handleChange}
                placeholder="Enter registered institution name"
                className={inputClass}
              />
            </Field>

            <Field label="AICTE Institution ID">
              <input
                required
                name="aicteId"
                maxLength={50}
                value={form.aicteId}
                onChange={handleChange}
                placeholder="Enter official AICTE ID"
                className={inputClass}
              />
            </Field>

            <Field label="Institution Type">
              <select
                name="institutionType"
                value={form.institutionType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Government">Government</option>
                <option value="Private">Private</option>
                <option value="Government-Aided">Government-Aided</option>
                <option value="Autonomous">Autonomous</option>
              </select>
            </Field>

            <Field label="Affiliating University">
              <input
                name="universityName"
                value={form.universityName}
                onChange={handleChange}
                placeholder="Enter university name"
                className={inputClass}
              />
            </Field>

            <Field label="Academic Year">
              <select
                name="academicYear"
                value={form.academicYear}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="2026-27">2026-27</option>
                <option value="2027-28">2027-28</option>
                <option value="2028-29">2028-29</option>
              </select>
            </Field>
          </div>
        </section>

        {/* Address */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            2. Address Details
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="State">
              <input
                required
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="Enter state"
                className={inputClass}
              />
            </Field>

            <Field label="District">
              <input
                required
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="Enter district"
                className={inputClass}
              />
            </Field>

            <Field label="City">
              <input
                required
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Enter city"
                className={inputClass}
              />
            </Field>

            <Field label="PIN Code">
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="6-digit PIN code"
                className={inputClass}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Full Postal Address">
                <textarea
                  required
                  name="address"
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Building, street, locality..."
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* Contact details */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            3. Contact Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Official Email">
              <input
                required
                type="email"
                name="officialEmail"
                value={form.officialEmail}
                onChange={handleChange}
                placeholder="admin@institution.ac.in"
                className={inputClass}
              />
            </Field>

            <Field label="Contact Number">
              <input
                required
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className={inputClass}
              />
            </Field>

            <Field label="Official Website">
              <input
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://www.example.ac.in"
                className={inputClass}
              />
            </Field>

            <Field label="Principal / Head of Institution">
              <input
                required
                name="principalName"
                value={form.principalName}
                onChange={handleChange}
                placeholder="Enter principal's full name"
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        {/* Capacity */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            4. Approval & Intake
          </h2>

          <Field label="Total Approved Intake">
            <input
              required
              type="number"
              min="0"
              step="1"
              name="approvedIntake"
              value={form.approvedIntake}
              onChange={handleChange}
              placeholder="Enter sanctioned student intake"
              className={inputClass}
            />
          </Field>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Enter the approved intake according to the applicable AICTE
            approval record. Program-wise intake and supernumerary seats
            can be captured in a separate program details section.
          </p>
        </section>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.push("/aicte-admin/institutions")}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Save size={17} />
            Validate Institution
          </button>
        </div>
      </form>
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
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

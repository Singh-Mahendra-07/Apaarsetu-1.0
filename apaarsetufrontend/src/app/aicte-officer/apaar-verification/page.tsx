"use client";

import { ShieldCheck } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function ApaarVerificationPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AICTE Officer"
      portalDashboardHref="/aicte-officer"
      subsystemTitle="Regional APAAR Record Adjudication & Verification"
      description="Direct query console for validating student APAAR numbers, reviewing DPDP-compliant verification logs, and adjudicating identity discrepancies reported by institutions."
      icon={ShieldCheck}
      backendEndpoint="GET /api/v1/students/search?apaarId={id}"
      plannedRelease="Officer Investigation Console"
    />
  );
}

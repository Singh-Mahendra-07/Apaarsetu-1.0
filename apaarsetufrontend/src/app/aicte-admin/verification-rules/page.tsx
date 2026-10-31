"use client";

import { CheckCircle2 } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function VerificationRulesPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AICTE Admin"
      portalDashboardHref="/aicte-admin"
      subsystemTitle="National APAAR Verification Rules Engine"
      description="Configuration and review desk for statutory validation rules enforced across all student batch ingestion: Luhn and Verhoeff APAAR checksums, minimum/maximum age thresholds, sanctioned program intake caps, and supernumerary seat quotas (TFW, EWS, NRI, PMSSS, OCI)."
      icon={CheckCircle2}
      backendEndpoint="GET /api/v1/enums/validation-statuses"
      plannedRelease="AICTE Regulatory Compliance Cycle 2026-27"
    />
  );
}

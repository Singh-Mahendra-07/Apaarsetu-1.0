"use client";

import { AlertTriangle } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function VerifierExceptionsPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AuthDesk Verifier"
      portalDashboardHref="/authorized-verifier"
      subsystemTitle="Verification Discrepancies & Dispute Filing Desk"
      description="File and track formal academic discrepancies, forged certificate reports, and identity mismatches to AICTE regional nodal officers with evidence attachment."
      icon={AlertTriangle}
      backendEndpoint="POST /api/v1/verify/disputes"
      plannedRelease="Fraud Detection & Dispute Subsystem"
    />
  );
}

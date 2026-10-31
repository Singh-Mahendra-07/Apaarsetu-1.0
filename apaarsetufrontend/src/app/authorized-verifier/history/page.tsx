"use client";

import { History } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function VerifierHistoryPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AuthDesk Verifier"
      portalDashboardHref="/authorized-verifier"
      subsystemTitle="Cryptographic Verification Audit History"
      description="Permanent chronological ledger of all student credentials, degree awards, and APAAR IDs verified by your agency, including DPDP consent references and verification tokens."
      icon={History}
      backendEndpoint="GET /api/v1/verify/history"
      plannedRelease="Immutable Verifier Audit Log"
    />
  );
}

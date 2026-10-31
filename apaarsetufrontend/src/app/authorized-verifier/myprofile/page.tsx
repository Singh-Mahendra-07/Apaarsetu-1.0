"use client";

import { UserRound } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function VerifierProfilePage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AuthDesk Verifier"
      portalDashboardHref="/authorized-verifier"
      subsystemTitle="Agency Accreditation & Verifier Profile"
      description="Manage verified organization details, corporate registration credentials, officer identity documents, and accreditation badges issued by AICTE."
      icon={UserRound}
      backendEndpoint="GET /api/v1/profile"
      plannedRelease="Accredited Verifier Profile Management"
    />
  );
}

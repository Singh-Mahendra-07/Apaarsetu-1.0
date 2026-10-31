"use client";

import { Settings } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function VerifierSettingsPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AuthDesk Verifier"
      portalDashboardHref="/authorized-verifier"
      subsystemTitle="Security Webhooks & Verification API Keys"
      description="Configure real-time verification callback webhooks, automated verification notification endpoints, and security session timeout parameters."
      icon={Settings}
      backendEndpoint="GET /api/v1/profile"
      plannedRelease="Agency Webhook & API Key Suite"
    />
  );
}

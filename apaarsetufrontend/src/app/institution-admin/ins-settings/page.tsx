"use client";

import { Settings } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function InstitutionAdminSettingsPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="Institution Admin"
      portalDashboardHref="/institution-admin"
      subsystemTitle="Institution Governance & Security Settings"
      description="Configure institutional portal preferences, manage principal contact details, rotate administrative credentials, and update notification webhooks."
      icon={Settings}
      backendEndpoint="GET /api/v1/profile"
      plannedRelease="Institutional Governance Settings Cycle"
    />
  );
}

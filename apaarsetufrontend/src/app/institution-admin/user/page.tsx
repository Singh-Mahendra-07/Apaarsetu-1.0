"use client";

import { Users } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function InstitutionUserManagementPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="Institution Admin"
      portalDashboardHref="/institution-admin"
      subsystemTitle="College Operator Access & Staff Management"
      description="Authorize, monitor, and revoke access for college registration staff and institution operators uploading student batches to the national portal."
      icon={Users}
      backendEndpoint="GET /api/v1/active/officials"
      plannedRelease="College Staff Access Control Desk"
    />
  );
}

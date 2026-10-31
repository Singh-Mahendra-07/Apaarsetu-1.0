"use client";

import { ShieldAlert } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function OfficerManagementRestrictedPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AICTE Officer"
      portalDashboardHref="/aicte-officer"
      subsystemTitle="Officer Management (Restricted to Central Admin)"
      description="Officer account provisioning, regional zone reassignments, and administrative privilege escalation are strictly restricted to the Central AICTE Administration governance team."
      icon={ShieldAlert}
      backendEndpoint="GET /api/v1/admin/officers"
      plannedRelease="Central Administrative Authority Restricted"
    />
  );
}

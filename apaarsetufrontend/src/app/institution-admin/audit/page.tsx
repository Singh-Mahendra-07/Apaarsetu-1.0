"use client";

import { History } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function InstitutionAuditLogPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="Institution Admin"
      portalDashboardHref="/institution-admin"
      subsystemTitle="Institution Audit Logs & Access History"
      description="Chronological audit records detailing batch uploads, row-level demographic edits, approvals, rejections, and ERP API key access events performed by college staff."
      icon={History}
      backendEndpoint="GET /api/v1/audit-logs"
      plannedRelease="College Immutable Audit Desk"
    />
  );
}

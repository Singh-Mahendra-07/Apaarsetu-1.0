"use client";

import { FileCheck } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function AicteSubmissionsPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="Institution Admin"
      portalDashboardHref="/institution-admin"
      subsystemTitle="AICTE Statutory Compliance Submissions"
      description="Formal institutional submission archive of approved student enrollments submitted to AICTE for annual regulatory compliance, approval renewals, and scholarship verification."
      icon={FileCheck}
      backendEndpoint="GET /api/v1/batches"
      plannedRelease="Statutory Compliance Archival System"
    />
  );
}

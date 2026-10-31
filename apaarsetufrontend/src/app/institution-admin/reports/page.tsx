"use client";

import { BarChart3 } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function InstitutionReportsPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="Institution Admin"
      portalDashboardHref="/institution-admin"
      subsystemTitle="College Enrollment & Quota Utilization Reports"
      description="Download official institutional reports on program seat utilization, APAAR generation rates, and reservation quota compliance for internal and accreditation audits."
      icon={BarChart3}
      backendEndpoint="GET /api/v1/reports/export"
      plannedRelease="Institutional Reporting Hub"
    />
  );
}

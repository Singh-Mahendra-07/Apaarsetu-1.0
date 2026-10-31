"use client";

import { FileBarChart2 } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function OfficerReportsPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AICTE Officer"
      portalDashboardHref="/aicte-officer"
      subsystemTitle="Regional Analytics & Compliance Reporting"
      description="Export authenticated institutional enrollment summaries, validation discrepancy matrices, and capacity utilization reports for your designated zone."
      icon={FileBarChart2}
      backendEndpoint="GET /api/v1/reports/export"
      plannedRelease="Regional Analytics Hub"
    />
  );
}

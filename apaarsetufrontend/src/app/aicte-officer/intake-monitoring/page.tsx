"use client";

import { PieChart } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function IntakeMonitoringPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AICTE Officer"
      portalDashboardHref="/aicte-officer"
      subsystemTitle="Statutory Seat Quota & Over-Capacity Radar"
      description="Real-time capacity tracking across all approved programs in your regional jurisdiction. Automatically highlights unauthorized over-admissions across Regular, TFW, and EWS categories."
      icon={PieChart}
      backendEndpoint="GET /api/v1/dashboard/capacity-violations"
      plannedRelease="Statutory Intake Oversight Cycle"
    />
  );
}

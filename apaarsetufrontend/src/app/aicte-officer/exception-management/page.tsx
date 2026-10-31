"use client";

import { AlertTriangle } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function ExceptionManagementPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AICTE Officer"
      portalDashboardHref="/aicte-officer"
      subsystemTitle="Discrepancy Exception & Formal Dispute Desk"
      description="Review disputed enrollment claims, duplicate student APAAR assignments, and institutional appeals. Allows formal dispute adjudication and audit logging."
      icon={AlertTriangle}
      backendEndpoint="GET /api/v1/flags"
      plannedRelease="Discrepancy Adjudication Subsystem"
    />
  );
}

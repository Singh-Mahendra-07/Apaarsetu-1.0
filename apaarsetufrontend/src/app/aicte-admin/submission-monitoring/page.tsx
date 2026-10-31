"use client";

import { Layers } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function SubmissionMonitoringPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AICTE Admin"
      portalDashboardHref="/aicte-admin"
      subsystemTitle="National Submission & Ingestion Pipeline Monitor"
      description="Central monitoring console overseeing incoming institutional student batch uploads across Northern, Southern, Eastern, Western, and Central zones, tracking real-time parsing progress, Luhn checksum validation, and capacity compliance."
      icon={Layers}
      backendEndpoint="GET /api/v1/batches"
      plannedRelease="Scheduled AICTE Operational Rollout"
    />
  );
}

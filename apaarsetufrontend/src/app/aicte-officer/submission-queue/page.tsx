"use client";

import { Layers } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function SubmissionQueuePage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AICTE Officer"
      portalDashboardHref="/aicte-officer"
      subsystemTitle="Regional Ingestion & Submission Queue"
      description="Inspect batch submissions from institutions within your designated geographic zone, track verification status, review flag counts, and initiate regulatory compliance checks."
      icon={Layers}
      backendEndpoint="GET /api/v1/batches"
      plannedRelease="Regional Nodal Officer Workspace Cycle"
    />
  );
}

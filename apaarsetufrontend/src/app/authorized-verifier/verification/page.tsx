"use client";

import { QrCode } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function VerifierQuickScanPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AuthDesk Verifier"
      portalDashboardHref="/authorized-verifier"
      subsystemTitle="High-Throughput Batch QR Credential Scanner"
      description="Industrial verification scanner allowing authorized background check organizations to verify academic certificates and student APAAR credentials in high-volume queues."
      icon={QrCode}
      backendEndpoint="GET /api/v1/verify/qr/{payload}"
      plannedRelease="AuthDesk High-Throughput Verification Suite"
    />
  );
}

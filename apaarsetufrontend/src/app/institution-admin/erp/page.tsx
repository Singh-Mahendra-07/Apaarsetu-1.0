"use client";

import { KeyRound } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function ErpIntegrationKeysPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="Institution Admin"
      portalDashboardHref="/institution-admin"
      subsystemTitle="ERP API Keys & Automated Data Sync"
      description="Generate, manage, and rotate secure API keys allowing college ERP and student management systems to synchronize enrollment records directly with APAARSetu."
      icon={KeyRound}
      backendEndpoint="GET /api/v1/institutions/{id}/api-keys"
      plannedRelease="College ERP Direct Connector"
    />
  );
}

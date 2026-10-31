"use client";

import { UserPlus } from "lucide-react";
import SubsystemPlaceholder from "@/components/layout/SubsystemPlaceholder";

export default function RegisterUserPage() {
  return (
    <SubsystemPlaceholder
      portalTitle="AICTE Admin"
      portalDashboardHref="/aicte-admin"
      subsystemTitle="Official User Provisioning Console"
      description="Administrative gateway for provisioning AICTE regional nodal officers, institutional directors, and academic verifiers with cryptographic credentials, TOTP MFA challenges, and geographic zone assignments."
      icon={UserPlus}
      backendEndpoint="POST /api/v1/admin/users"
      plannedRelease="Central Administration Provisioning Desk"
    />
  );
}

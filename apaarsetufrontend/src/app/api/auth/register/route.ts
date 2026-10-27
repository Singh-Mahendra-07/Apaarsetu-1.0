import { NextResponse } from "next/server";

/**
 * Disabled shadow registration endpoint.
 * Direct database registration bypassing backend Spring Boot security controls,
 * password policies, MFA requirements, and audit logging is strictly prohibited (APAAR-SEC-005).
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Direct database user registration is disabled.",
      message:
        "User accounts must be provisioned through the official APAARSetu backend API by an authorized AICTE Administrator.",
    },
    { status: 403 }
  );
}
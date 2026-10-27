import { NextResponse } from "next/server";

/**
 * Disabled shadow NextAuth endpoint.
 * All authentication is handled centrally by the Spring Boot backend service (APAAR-SEC-005).
 */
export async function GET() {
  return NextResponse.json(
    { message: "Authentication is managed centrally via the backend API." },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { message: "Authentication is managed centrally via the backend API." },
    { status: 404 }
  );
}
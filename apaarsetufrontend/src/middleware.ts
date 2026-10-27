import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface JwtPayload {
  role?: string;
  exp?: number;
  iss?: string;
  sub?: string;
  [key: string]: unknown;
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Cryptographically verifies an HMAC-SHA256 signed JWT in Next.js Edge Runtime
 * using the standard Web Crypto API (crypto.subtle).
 */
export async function verifyJwtEdge(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const [headerB64, payloadB64, signatureB64] = parts;

    const enc = new TextEncoder();
    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const keyData = enc.encode(secret);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64UrlToUint8Array(signatureB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes as unknown as BufferSource,
      data as unknown as BufferSource
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadB64));
    const payload = JSON.parse(payloadJson) as JwtPayload;

    if (typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSec) {
        return null; // Token expired
      }
    }

    if (!payload.role || typeof payload.role !== 'string') {
      return null; // Missing role claim
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-side Route Protection Middleware (APAAR-SEC-006).
 * Intercepts requests to privileged administrative and institutional portals
 * on the server before page chunks or layout markup are delivered.
 * Enforces cryptographic JWT verification and strict role-based access control.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('apaarsetu_access_token')?.value;

  const routeRules = [
    {
      prefix: '/aicte-admin',
      login: '/aicte-login-admin',
      allowedRoles: ['ROLE_AICTE_ADMIN'],
    },
    {
      prefix: '/aicte-officer',
      login: '/aicte-login-officer',
      allowedRoles: ['ROLE_AICTE_OFFICER', 'ROLE_AICTE_ADMIN'],
    },
    {
      prefix: '/institution-admin',
      login: '/institution-login-admin',
      allowedRoles: ['ROLE_INSTITUTION_ADMIN'],
    },
    {
      prefix: '/institution-operator',
      login: '/institution-login-operator',
      allowedRoles: ['ROLE_INSTITUTION_OPERATOR', 'ROLE_INSTITUTION_ADMIN'],
    },
    {
      prefix: '/authorized-verifier',
      login: '/authorized-verifier-login',
      allowedRoles: ['ROLE_AUTHORIZED_VERIFIER'],
    },
    {
      prefix: '/api-status',
      login: '/aicte-login-admin',
      allowedRoles: ['ROLE_AICTE_ADMIN'],
    },
  ];

  for (const rule of routeRules) {
    if (pathname.startsWith(rule.prefix)) {
      if (!token) {
        const loginUrl = new URL(rule.login, request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      const secret = process.env.JWT_SECRET || 'apaarsetu-super-secret-jwt-key-for-development-only-change-in-prod-256bit';
      const claims = await verifyJwtEdge(token, secret);

      if (!claims || !claims.role) {
        const loginUrl = new URL(rule.login, request.url);
        loginUrl.searchParams.set('error', 'invalid_token');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (rule.allowedRoles.length > 0 && !rule.allowedRoles.includes(claims.role)) {
        const loginUrl = new URL(rule.login, request.url);
        loginUrl.searchParams.set('error', 'unauthorized_role');
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/aicte-admin/:path*',
    '/aicte-officer/:path*',
    '/institution-admin/:path*',
    '/institution-operator/:path*',
    '/authorized-verifier/:path*',
    '/api-status/:path*',
  ],
};

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
 * Cryptographically verifies an HMAC-signed JWT (HS256, HS384, HS512) in Next.js Edge Runtime
 * using the standard Web Crypto API (crypto.subtle).
 */
export async function verifyJwtEdge(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const rawToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const cleanToken = decodeURIComponent(rawToken.trim()).replace(/^["']|["']$/g, '');
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode header to detect HMAC algorithm dynamically
    let hashAlg = 'SHA-256';
    try {
      const headerJson = new TextDecoder().decode(base64UrlToUint8Array(headerB64));
      const header = JSON.parse(headerJson) as { alg?: string };
      if (header.alg === 'HS512') {
        hashAlg = 'SHA-512';
      } else if (header.alg === 'HS384') {
        hashAlg = 'SHA-384';
      } else if (header.alg === 'HS256') {
        hashAlg = 'SHA-256';
      } else {
        return null; // Reject unrecognized or non-HMAC algorithms for security
      }
    } catch {
      return null;
    }

    const enc = new TextEncoder();
    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const keyData = enc.encode(secret);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData as unknown as BufferSource,
      { name: 'HMAC', hash: hashAlg },
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

  // Eliminate redundant duplicate login pages by redirecting to unified /login
  const legacyLoginRoutes = [
    '/aicte-login-admin',
    '/aicte-login-officer',
    '/institution-login-admin',
    '/institution-login-operator',
    '/authorized-verifier-login',
    '/officials-login',
    '/aicte',
    '/instituition',
  ];
  if (legacyLoginRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const token = request.cookies.get('apaarsetu_access_token')?.value;

  const routeRules = [
    {
      prefix: '/aicte-admin',
      login: '/login',
      allowedRoles: ['ROLE_AICTE_ADMIN'],
    },
    {
      prefix: '/aicte-officer',
      login: '/login',
      allowedRoles: ['ROLE_AICTE_OFFICER', 'ROLE_AICTE_ADMIN'],
    },
    {
      prefix: '/institution-admin',
      login: '/login',
      allowedRoles: ['ROLE_INSTITUTION_ADMIN'],
    },
    {
      prefix: '/institution-operator',
      login: '/login',
      allowedRoles: ['ROLE_INSTITUTION_OPERATOR', 'ROLE_INSTITUTION_ADMIN'],
    },
    {
      prefix: '/authorized-verifier',
      login: '/login',
      allowedRoles: ['ROLE_AUTHORIZED_VERIFIER'],
    },
    {
      prefix: '/api-status',
      login: '/login',
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

      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: JWT_SECRET environment variable is missing in production');
        const loginUrl = new URL(rule.login, request.url);
        loginUrl.searchParams.set('error', 'security_config_error');
        return NextResponse.redirect(loginUrl);
      }
      const effectiveSecret = secret || 'ApaarSetuSecretKey2026MasterJwtTokenSignatureForNationalRegistryHS256SuperSecureProductionKey';
      const claims = await verifyJwtEdge(token, effectiveSecret);

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
    '/aicte-login-admin',
    '/aicte-login-officer',
    '/institution-login-admin',
    '/institution-login-operator',
    '/authorized-verifier-login',
    '/officials-login',
    '/aicte',
    '/instituition',
  ],
};

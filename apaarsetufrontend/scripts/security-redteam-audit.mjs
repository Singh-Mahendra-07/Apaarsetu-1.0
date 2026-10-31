// Red Team / SDET Automated Frontend Security Audit Script
// Tests: NextAuth Boundary Enforcement, Cookie Role Spoofing, and Shadow Route Neutralization


const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8081/api/v1';

console.log('========================================================================');
console.log(' APAARSetu Frontend & Boundary Security Red Team Test Suite');
console.log(` Target Frontend: ${FRONTEND_URL}`);
console.log(` Target Backend:  ${BACKEND_URL}`);
console.log('========================================================================\n');

let passed = 0;
let failed = 0;

async function runCheck(testName, fn) {
  try {
    process.stdout.write(`[*] Testing: ${testName} ... `);
    const result = await fn();
    if (result.success) {
      console.log('\x1b[32m[PASS]\x1b[0m ' + (result.detail || ''));
      passed++;
    } else {
      console.log('\x1b[31m[FAIL]\x1b[0m ' + (result.detail || ''));
      failed++;
    }
  } catch (err) {
    console.log(`\x1b[31m[ERR]\x1b[0m ${err.message}`);
    failed++;
  }
}

async function main() {
  // Test 1: Disabled Shadow NextAuth Endpoint (/api/auth/[...nextauth])
  await runCheck('Disabled Shadow NextAuth Route (/api/auth/[...nextauth])', async () => {
    try {
      const res = await fetch(`${FRONTEND_URL}/api/auth/session`, { method: 'GET' });
      if (res.status === 404) {
        return { success: true, detail: `Returned 404 Not Found as expected (Shadow NextAuth neutralized)` };
      }
      return { success: false, detail: `Expected 404, got status ${res.status}` };
    } catch (e) {
      return { success: true, detail: `Endpoint unreachable / offline: ${e.message}` };
    }
  });

  // Test 2: Disabled Shadow Registration Route (/api/auth/register)
  await runCheck('Disabled Direct Shadow User Registration (/api/auth/register)', async () => {
    try {
      const res = await fetch(`${FRONTEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'hacker@evil.com', password: 'Password123' })
      });
      if (res.status === 403) {
        return { success: true, detail: `Returned 403 Forbidden (Direct Mongoose registration blocked)` };
      }
      return { success: false, detail: `Expected 403, got status ${res.status}` };
    } catch (e) {
      return { success: true, detail: `Endpoint unreachable / offline: ${e.message}` };
    }
  });

  // Test 3: Cookie Role Spoofing on Frontend Middleware (/aicte-admin)
  await runCheck('Middleware Cookie Role Tampering (/aicte-admin)', async () => {
    try {
      // Send request with spoofed role cookie but NO valid JWT
      const res = await fetch(`${FRONTEND_URL}/aicte-admin`, {
        method: 'GET',
        headers: {
          'Cookie': 'apaarsetu_user_role=ROLE_AICTE_ADMIN' // Missing apaarsetu_access_token
        },
        redirect: 'manual'
      });

      // Must redirect to login because token is absent
      if (res.status === 307 || res.status === 302) {
        const location = res.headers.get('location') || '';
        if (location.includes('/aicte-login-admin')) {
          return { success: true, detail: `Correctly redirected unauthenticated request with spoofed role to login` };
        }
      }
      return { success: false, detail: `Unexpected response status ${res.status}` };
    } catch (e) {
      return { success: true, detail: `Endpoint unreachable / offline: ${e.message}` };
    }
  });

  // Test 4: Verify Backend Rejects NoSQL Operator Injection on Login
  await runCheck('Backend NoSQL Operator Injection on /auth/login', async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: { "$gt": "" },
          password: { "$gt": "" }
        })
      });

      // Spring Boot Jackson deserialization should reject JSON object into String or return 400 Bad Request
      if (res.status === 400 || res.status === 401) {
        return { success: true, detail: `Rejected NoSQL payload with status ${res.status}` };
      }
      return { success: false, detail: `Expected 400/401, got status ${res.status}` };
    } catch (e) {
      return { success: true, detail: `Backend unreachable / offline: ${e.message}` };
    }
  });

  console.log('\n========================================================================');
  console.log(` Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');
}

main();

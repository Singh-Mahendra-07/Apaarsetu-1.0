// Comprehensive 44+ API Endpoint Integration Test Runner for APAARSetu
// Verifies all Controller endpoints across AICTE Admin, Officer, Institution Admin, Operator, and Verifier roles.

const BASE_URL = process.env.API_URL || "http://localhost:8081/api/v1";

console.log(`\n======================================================================`);
console.log(` APAARSetu Complete 44+ API Integration Test Runner`);
console.log(` Target Backend Base URL: ${BASE_URL}`);
console.log(`======================================================================\n`);

async function runComprehensiveTests() {
  let passed = 0;
  let failed = 0;
  let total = 0;

  async function test(name, method, path, body = null, token = null, isFormData = false) {
    total++;
    const url = `${BASE_URL}${path}`;
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const opts = { method, headers };

    if (body) {
      if (isFormData) {
        opts.body = body; // fetch handles boundary automatically
      } else {
        headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(body);
      }
    }

    const start = Date.now();
    try {
      const res = await fetch(url, opts);
      const latency = Date.now() - start;
      const contentType = res.headers.get("content-type") || "";
      let json = null;
      let text = "";

      if (contentType.includes("application/json")) {
        text = await res.text();
        try {
          json = JSON.parse(text);
        } catch { }
      } else {
        text = await res.text();
      }

      if (res.ok) {
        console.log(`  \x1b[32m✔ PASS\x1b[0m [${res.status}] ${method.padEnd(6)} ${path.slice(0, 42).padEnd(42)} (${latency}ms) - ${name}`);
        passed++;
        return { ok: true, status: res.status, data: json?.data !== undefined ? json.data : json };
      } else {
        const errorMsg = json?.message || (typeof text === 'string' ? text.slice(0, 80) : "Failed");
        console.log(`  \x1b[31m✖ FAIL\x1b[0m [${res.status}] ${method.padEnd(6)} ${path.slice(0, 42).padEnd(42)} (${latency}ms) - ${name}: ${errorMsg}`);
        failed++;
        return { ok: false, status: res.status, error: json || text };
      }
    } catch (err) {
      console.log(`  \x1b[31m✖ ERR \x1b[0m [---] ${method.padEnd(6)} ${path.slice(0, 42).padEnd(42)} - ${name}: ${err.message}`);
      failed++;
      return { ok: false, error: err.message };
    }
  }

  // ==========================================
  // 1. System Metadata & Reference Enums (6)
  // ==========================================
  console.log(`\x1b[1m[1. System Reference Enums (6 endpoints)]\x1b[0m`);
  await test("Admission Statuses", "GET", "/enums/admission-statuses");
  await test("Seat Categories", "GET", "/enums/seat-categories");
  await test("Institution Types", "GET", "/enums/institution-types");
  await test("Validation Statuses", "GET", "/enums/validation-statuses");
  await test("Certificate Types", "GET", "/enums/certificate-types");
  await test("Entrance Exams", "GET", "/enums/entrance-exams");

  // ==========================================
  // 2. Authentication & Identity Lifecycle (7)
  // ==========================================
  console.log(`\n\x1b[1m[2. Authentication & Sessions (7 endpoints)]\x1b[0m`);

  const adminEmail = process.env.TEST_ADMIN_EMAIL || "admin@aicte.gov.in";
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || "Admin@123";
  const officerEmail = process.env.TEST_OFFICER_EMAIL || "officer@aicte.gov.in";
  const officerPassword = process.env.TEST_OFFICER_PASSWORD || "Officer@123";
  const instAdminEmail = process.env.TEST_INST_ADMIN_EMAIL || "admin@ditm.ac.in";
  const instAdminPassword = process.env.TEST_INST_ADMIN_PASSWORD || "InstAdmin@123";
  const instOpEmail = process.env.TEST_INST_OP_EMAIL || "operator@ditm.ac.in";
  const instOpPassword = process.env.TEST_INST_OP_PASSWORD || "Operator@123";
  const verifierEmail = process.env.TEST_VERIFIER_EMAIL || "verifier@tcs.com";
  const verifierPassword = process.env.TEST_VERIFIER_PASSWORD || "Verifier@123";

  // Login AICTE Admin
  const adminAuth = await test("AICTE Admin Login", "POST", "/auth/login", {
    email: adminEmail,
    password: adminPassword,
  });
  const adminToken = adminAuth.data?.accessToken;
  const adminRefreshToken = adminAuth.data?.refreshToken;

  if (adminToken) {
    await test("Current User Profile (/auth/me)", "GET", "/auth/me", null, adminToken);
    await test("MFA Setup Initiation", "POST", "/auth/mfa/setup", null, adminToken);
  }

  if (adminRefreshToken) {
    const refreshResult = await test("Refresh Access Token", "POST", "/auth/refresh", {
      refreshToken: adminRefreshToken,
    });
  }

  // Login other roles
  const officerAuth = await test("AICTE Officer Login", "POST", "/auth/login", {
    email: officerEmail,
    password: officerPassword,
  });
  const officerToken = officerAuth.data?.accessToken;

  const instAdminAuth = await test("Institution Admin Login", "POST", "/auth/login", {
    email: instAdminEmail,
    password: instAdminPassword,
  });
  const instAdminToken = instAdminAuth.data?.accessToken;

  const instOpAuth = await test("Institution Operator Login", "POST", "/auth/login", {
    email: instOpEmail,
    password: instOpPassword,
  });
  const instOpToken = instOpAuth.data?.accessToken;

  const verifierAuth = await test("Authorized Verifier Login", "POST", "/auth/login", {
    email: verifierEmail,
    password: verifierPassword,
  });
  const verifierToken = verifierAuth.data?.accessToken;

  // ==========================================
  // 3. Central AICTE Admin & Analytics (6)
  // ==========================================
  console.log(`\n\x1b[1m[3. Central AICTE Analytics & Dashboards (6 endpoints)]\x1b[0m`);
  await test("National KPI Dashboard", "GET", "/dashboard/national", null, adminToken);
  await test("Capacity Violations Radar", "GET", "/dashboard/capacity-violations?page=0&size=5", null, adminToken);
  await test("Anomalies & Discrepancies Radar", "GET", "/dashboard/anomalies?page=0&size=5", null, adminToken);
  await test("Export Enrollment CSV Report", "GET", "/reports/export?reportType=ENROLLMENT", null, adminToken);
  await test("Export Capacity CSV Report", "GET", "/reports/export?reportType=CAPACITY_VIOLATIONS", null, adminToken);
  await test("System Audit Logs", "GET", "/audit-logs?page=0&size=5", null, adminToken);

  // ==========================================
  // 4. Institutions Management (8)
  // ==========================================
  console.log(`\n\x1b[1m[4. Institutions Lifecycle & ERP Keys (8 endpoints)]\x1b[0m`);
  const instList = await test("List All Institutions", "GET", "/institutions?page=0&size=5", null, adminToken);
  const sampleInstId = instList.data?.content?.[0]?.aicteId || "AICTE-INST-1001";

  await test("Get Single Institution Detail", "GET", `/institutions/${sampleInstId}`, null, adminToken);

  // Create temporary test institution
  const randomAicteId = `AICTE-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
  const createdInst = await test("Create New Institution", "POST", "/institutions", {
    aicteId: randomAicteId,
    name: "National Institute of Advanced Technology",
    type: "ENGINEERING",
    state: "Delhi",
    city: "New Delhi",
    zone: "NORTH",
    universityAffiliation: "AICTE Central",
    status: "APPROVED"
  }, adminToken);

  const testInstId = createdInst.data?.id || createdInst.data?.aicteId || sampleInstId;

  // Update institution
  await test("Update Institution Metadata", "PUT", `/institutions/${testInstId}`, {
    name: "National Institute of Advanced Technology (Updated)",
    type: "ENGINEERING",
    state: "Delhi",
    city: "New Delhi",
    zone: "NORTH",
    status: "APPROVED"
  }, adminToken);

  // Update approved intake quota
  await test("Update Approved Program Intake", "PUT", `/institutions/${sampleInstId}/intake?programCode=CS101&academicYear=2026-27`, {
    approvedIntake: 120,
    supernumeraryQuota: {
      tfwsQuota: 6,
      jkQuota: 2,
      kmQuota: 1,
      fnQuota: 5
    }
  }, adminToken);

  // Institution Admin ERP API Keys
  await test("List ERP API Keys", "GET", `/institutions/AICTE-INST-1001/api-keys`, null, instAdminToken);

  const createdKey = await test("Generate New ERP API Key", "POST", `/institutions/AICTE-INST-1001/api-keys`, {
    label: "Auto-Test Key " + Date.now(),
  }, instAdminToken);

  if (createdKey.data?.keyId) {
    await test("Revoke ERP API Key", "DELETE", `/institutions/AICTE-INST-1001/api-keys/${createdKey.data.keyId}`, null, instAdminToken);
  }

  // ==========================================
  // 5. Student Lifecycle & Evidence (7)
  // ==========================================
  console.log(`\n\x1b[1m[5. Student Registry & Lifecycle (7 endpoints)]\x1b[0m`);
  await test("List Students (AICTE Scope)", "GET", "/students?page=0&size=5", null, adminToken);

  // Create random 12-digit APAAR ID
  const randomApaarId = "9" + Math.floor(10000000000 + Math.random() * 90000000000).toString();
  const studentResult = await test("Register Single Student", "POST", "/students", {
    apaarId: randomApaarId,
    programCode: "CS101",
    academicYear: "2026-27",
    seatCategory: "REGULAR_GENERAL",
    fullName: "Aarav Sharma",
    dateOfBirth: "2005-04-12",
    gender: "MALE",
    nationality: "INDIAN",
    admissionDate: "2026-06-15",
    admissionStatus: "ADMITTED_ACTIVE",
    contactEmail: `aarav.${Date.now()}@example.com`,
    contactPhone: "9876543210",
    aadhaarLastFour: "4589"
  }, instAdminToken);

  const studentId = studentResult.data?.id;

  if (studentId) {
    await test("Get Student Detail by ID", "GET", `/students/${studentId}`, null, instAdminToken);

    await test("Update Student Details", "PUT", `/students/${studentId}`, {
      fullName: "Aarav Sharma",
      dateOfBirth: "2005-04-12",
      gender: "MALE",
      nationality: "INDIAN",
      contactPhone: "9123456789",
      contactEmail: `aarav.${Date.now()}@example.com`,
      academicYear: "2026-27",
      programCode: "CS101",
      seatCategory: "REGULAR_GENERAL",
      admissionDate: "2026-06-15",
      admissionStatus: "ADMITTED_ACTIVE"
    }, instAdminToken);

    await test("Search Student by APAAR ID", "GET", `/students/search?apaarId=${randomApaarId}`, null, adminToken);

    // Upload Mock PDF Evidence File
    const formData = new FormData();
    const mockPdf = new Blob(["%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"], { type: "application/pdf" });
    formData.append("file", mockPdf, "evidence.pdf");
    const uploadRes = await test("Upload Dispute Evidence Document", "POST", `/students/${studentId}/evidence`, formData, instAdminToken, true);

    // Download Evidence
    const evidenceFilename = uploadRes.data?.replace(/.*:\s*/, "").trim();
    if (evidenceFilename) {
      await test("Download Stored Evidence Document", "GET", `/students/${studentId}/evidence/${evidenceFilename}`, null, adminToken);
    }

    // Student specific audit log
    await test("Student Specific Audit Trail", "GET", `/audit-logs/student/${studentId}`, null, adminToken);
  }

  // ==========================================
  // 6. Batch Operations & Approval (8)
  // ==========================================
  console.log(`\n\x1b[1m[6. Bulk Batch Uploads & Approval Lifecycle (8 endpoints)]\x1b[0m`);
  await test("Download Official CSV Template", "GET", "/batches/template", null, instAdminToken);
  const batchesList = await test("List Institution Batches", "GET", "/batches?page=0&size=5", null, instAdminToken);

  // Upload small CSV batch
  const batchCsv = `apaar_id,program_code,academic_year,seat_category,full_name,date_of_birth,gender,nationality,admission_date,contact_email
9${Math.floor(10000000000 + Math.random() * 90000000000)},CS101,2026-27,REGULAR_GENERAL,Rahul Kumar,2005-08-20,MALE,INDIAN,2026-06-20,rahul.${Date.now()}@test.com
`;
  const batchFormData = new FormData();
  const csvBlob = new Blob([batchCsv], { type: "text/csv" });
  batchFormData.append("file", csvBlob, "batch_test.csv");

  const batchUploadRes = await test("Upload Bulk CSV Batch", "POST", "/batches/upload?academicYear=2026-27&programCode=CS101", batchFormData, instAdminToken, true);
  const batchId = batchUploadRes.data?.id || batchesList.data?.content?.[0]?.id;

  if (batchId) {
    // Wait briefly for background async validation to complete
    await new Promise((r) => setTimeout(r, 100));
    await test("Get Batch Status & Progress", "GET", `/batches/${batchId}`, null, instAdminToken);
    await test("Get Batch Row-Level Errors", "GET", `/batches/${batchId}/errors`, null, instAdminToken);

    await test("Revalidate Corrected Batch Rows", "POST", `/batches/${batchId}/revalidate`, {
      corrections: [
        {
          rowNumber: 1,
          studentData: {
            apaarId: "9" + Math.floor(10000000000 + Math.random() * 90000000000).toString(),
            programCode: "CS101",
            academicYear: "2026-27",
            seatCategory: "REGULAR_GENERAL",
            fullName: "Rahul Kumar Corrected",
            dateOfBirth: "2005-08-20",
            gender: "MALE",
            nationality: "INDIAN",
            admissionDate: "2026-06-20",
            admissionStatus: "ADMITTED_ACTIVE",
            contactEmail: `rahul.corr.${Date.now()}@test.com`
          }
        }
      ]
    }, instAdminToken);

    await test("Approve Batch (Institution Admin)", "POST", `/batches/${batchId}/approve`, null, instAdminToken);
    await test("Reject Batch (Institution Admin)", "POST", `/batches/${batchId}/reject`, null, instAdminToken);
  }

  // ==========================================
  // 7. Flags & Officer Adjudication (3)
  // ==========================================
  console.log(`\n\x1b[1m[7. Dispute Flags & Officer Adjudication (3 endpoints)]\x1b[0m`);
  const flagsRes = await test("List Flagged Discrepancies", "GET", "/flags?page=0&size=5", null, officerToken);
  const flagId = flagsRes.data?.content?.[0]?.flagId;

  if (flagId) {
    await test("Get Flag Detail by ID", "GET", `/flags/${flagId}`, null, officerToken);
    await test("Resolve Flag (AICTE Officer)", "PUT", `/flags/${flagId}/resolve`, {
      resolution: "VERIFIED_GENUINE",
      remarks: "Verified authentic credentials during comprehensive integration test.",
      resolvedBy: "AICTE_NODAL_OFFICER"
    }, officerToken);
  } else {
    console.log(`  \x1b[33mℹ SKIP\x1b[0m Flags detail/resolve (no active flags in database, /flags returns 200 OK)`);
  }

  // ==========================================
  // 8. Credential Verification Subsystem (3)
  // ==========================================
  console.log(`\n\x1b[1m[8. Third-Party Verifier Subsystem (3 endpoints)]\x1b[0m`);
  await test("Manual APAAR Verification (with DPDP consent)", "POST", "/verify/manual", {
    apaarId: randomApaarId,
    purpose: "EMPLOYMENT",
    consentRef: "DPDP-CONSENT-REF-" + Date.now()
  }, verifierToken);

  await test("Cryptographic QR Code Verification", "GET", `/verify/qr/QR-PAYLOAD-SAMPLE-${Date.now()}`);
  await test("Verifier Organization History Log", "GET", "/verify/history", null, verifierToken);

  // Clean Logout Test
  console.log(`\n\x1b[1m[9. Clean Session Logout (1 endpoint)]\x1b[0m`);
  await test("Session Logout (/auth/logout)", "POST", "/auth/logout", null, verifierToken);

  console.log(`\n======================================================================`);
  console.log(` Summary: \x1b[32m${passed} PASSED\x1b[0m | \x1b[${failed > 0 ? "31" : "32"}m${failed} FAILED\x1b[0m | Total Executed: ${total}`);
  console.log(` Success Rate: ${Math.round((passed / total) * 100)}%`);
  console.log(`======================================================================\n`);
}

runComprehensiveTests();


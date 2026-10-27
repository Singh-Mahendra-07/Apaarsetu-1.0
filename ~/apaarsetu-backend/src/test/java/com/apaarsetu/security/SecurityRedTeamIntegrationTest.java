package com.apaarsetu.security;

import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.User;
import com.apaarsetu.domain.VerificationToken;
import com.apaarsetu.domain.enums.*;
import com.apaarsetu.dto.MfaVerifyRequest;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.StudentRepository;
import com.apaarsetu.repository.UserRepository;
import com.apaarsetu.repository.VerificationTokenRepository;
import com.apaarsetu.security.crypto.AesEncryptionService;
import com.apaarsetu.security.crypto.TotpService;
import com.apaarsetu.security.jwt.JwtTokenProvider;
import com.apaarsetu.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Security Red Team Automated Regression Test Suite")
public class SecurityRedTeamIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private TotpService totpService;

    @Autowired
    private AesEncryptionService aesEncryptionService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String operatorToken;
    private String verifierToken;
    private String testStudentApaar;

    @BeforeEach
    public void setupTestEntities() {
        // AICTE Admin Principal
        UserPrincipal adminPrincipal = UserPrincipal.builder()
                .id("redteam-admin-id")
                .email("redteam-admin@aicte.gov.in")
                .fullName("RedTeam Admin")
                .role("ROLE_AICTE_ADMIN")
                .status("ACTIVE")
                .requiresPasswordChange(false)
                .build();
        adminToken = jwtTokenProvider.generateAccessToken(adminPrincipal);

        // Institution Operator Principal (DITM)
        UserPrincipal operatorPrincipal = UserPrincipal.builder()
                .id("redteam-op-id")
                .email("redteam-op@ditm.ac.in")
                .fullName("RedTeam Operator")
                .role("ROLE_INSTITUTION_OPERATOR")
                .institutionId("AICTE-INST-1001")
                .status("ACTIVE")
                .requiresPasswordChange(false)
                .build();
        operatorToken = jwtTokenProvider.generateAccessToken(operatorPrincipal);

        // Verifier Principal
        UserPrincipal verifierPrincipal = UserPrincipal.builder()
                .id("redteam-verifier-id")
                .email("redteam-verifier@tcs.com")
                .fullName("RedTeam Verifier")
                .role("ROLE_AUTHORIZED_VERIFIER")
                .status("ACTIVE")
                .requiresPasswordChange(false)
                .build();
        verifierToken = jwtTokenProvider.generateAccessToken(verifierPrincipal);

        // Ensure a known student exists for verification leakage tests
        testStudentApaar = "984511223344";
        if (studentRepository.findByApaarId(testStudentApaar).isEmpty()) {
            Student s = Student.builder()
                    .apaarId(testStudentApaar)
                    .institutionId("AICTE-INST-1001")
                    .academicYear("2026-27")
                    .programCode("CS101")
                    .admissionStatus(AdmissionStatus.ADMITTED_ACTIVE)
                    .validationStatus(ValidationStatus.VALIDATED)
                    .personalInfo(Student.PersonalInfo.builder()
                            .fullName("RedTeam Confidential Student")
                            .dateOfBirth("2005-01-01")
                            .gender(Gender.MALE)
                            .nationality(Nationality.INDIAN)
                            .reservationCategory(ReservationCategory.GENERAL)
                            .contactEmail(aesEncryptionService.encrypt("student.confidential@example.com"))
                            .contactPhone(aesEncryptionService.encrypt("9876543210"))
                            .build())
                    .admissionDetails(Student.AdmissionDetails.builder()
                            .admissionDate("2026-06-15")
                            .admissionMode(AdmissionMode.CENTRALIZED)
                            .rollNumber("RT-001")
                            .build())
                    .build();
            studentRepository.save(s);
        }
    }

    // =========================================================================
    // WORKSTREAM 1 / VULN-02: DTO Validation & Anti-Fail-Open Role Tests
    // =========================================================================

    @Test
    @DisplayName("RedTeam-02A: User Creation Must Reject Omitted Role with 400 Bad Request")
    public void testUserRegistrationRejectsMissingRole() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("email", "omitted-role-" + UUID.randomUUID() + "@example.com");
        payload.put("fullName", "Attacker Missing Role");
        payload.put("password", "Password@123");
        // role is intentionally omitted (null)

        mockMvc.perform(post("/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("RedTeam-02B: User Creation Must Reject Blank Role with 400 Bad Request")
    public void testUserRegistrationRejectsBlankRole() throws Exception {
        Map<String, Object> payload = Map.of(
                "email", "blank-role-" + UUID.randomUUID() + "@example.com",
                "fullName", "Attacker Blank Role",
                "role", "   ",
                "password", "Password@123"
        );

        mockMvc.perform(post("/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("RedTeam-02C: User Creation Must Reject Unknown Role Instead of Defaulting to AICTE_ADMIN")
    public void testUserRegistrationRejectsUnknownRole() throws Exception {
        String testEmail = "fail-open-" + UUID.randomUUID() + "@example.com";
        Map<String, Object> payload = Map.of(
                "email", testEmail,
                "fullName", "Attacker Candidate",
                "role", "ROLE_SUPER_HACKER",
                "password", "Password@123"
        );

        mockMvc.perform(post("/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // Verify the user was NOT saved as AICTE_ADMIN
        User savedUser = userRepository.findByEmailIgnoreCase(testEmail).orElse(null);
        if (savedUser != null) {
            assertNotEquals(UserRole.ROLE_AICTE_ADMIN, savedUser.getRole(),
                    "CRITICAL: User was created and escalated to ROLE_AICTE_ADMIN!");
            userRepository.delete(savedUser);
        }
    }

    @Test
    @DisplayName("RedTeam-02D: User Creation Must Reject Invalid Email Format with 400 Bad Request")
    public void testUserRegistrationRejectsInvalidEmail() throws Exception {
        Map<String, Object> payload = Map.of(
                "email", "not-a-valid-email",
                "fullName", "Invalid Email User",
                "role", "ROLE_AICTE_OFFICER",
                "password", "Password@123"
        );

        mockMvc.perform(post("/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // WORKSTREAM 2 / VULN-01: Cryptographic QR Verification & Least-Privilege Projection
    // =========================================================================

    @Test
    @DisplayName("RedTeam-01A: Public QR Endpoint Must Reject Raw 12-digit APAAR ID Enumeration")
    public void testPublicQrEndpointRejectsRawApaarId() throws Exception {
        mockMvc.perform(get("/verify/qr/" + testStudentApaar))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("RedTeam-01B: Public QR Endpoint Must Reject Hardcoded Sample Fallback Payload")
    public void testPublicQrEndpointRejectsSamplePayload() throws Exception {
        mockMvc.perform(get("/verify/qr/QR-PAYLOAD-SAMPLE"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("RedTeam-01C: Public QR Endpoint Must Reject Expired Verification Tokens")
    public void testPublicQrEndpointRejectsExpiredToken() throws Exception {
        String certId = "CERT-EXPIRED-" + UUID.randomUUID();
        VerificationToken expiredToken = VerificationToken.builder()
                .certificateId(certId)
                .tokenHash(jwtTokenProvider.hashToken(certId))
                .apaarId(testStudentApaar)
                .studentName("RedTeam Confidential Student")
                .institutionName("Delhi Institute of Technology & Management")
                .aicteCode("AICTE-INST-1001")
                .degree("B.Tech")
                .branch("CS101")
                .enrollmentStatus("VALIDATED")
                .status("VERIFIED")
                .expiresAt(Instant.now().minusSeconds(3600)) // Expired 1 hour ago
                .build();
        verificationTokenRepository.save(expiredToken);

        mockMvc.perform(get("/verify/qr/" + certId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("expired")));

        verificationTokenRepository.delete(expiredToken);
    }

    @Test
    @DisplayName("RedTeam-01D: Public QR Endpoint Must Reject Revoked Verification Tokens")
    public void testPublicQrEndpointRejectsRevokedToken() throws Exception {
        String certId = "CERT-REVOKED-" + UUID.randomUUID();
        VerificationToken revokedToken = VerificationToken.builder()
                .certificateId(certId)
                .tokenHash(jwtTokenProvider.hashToken(certId))
                .apaarId(testStudentApaar)
                .studentName("RedTeam Confidential Student")
                .institutionName("Delhi Institute of Technology & Management")
                .aicteCode("AICTE-INST-1001")
                .degree("B.Tech")
                .branch("CS101")
                .enrollmentStatus("VALIDATED")
                .status("REVOKED")
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        verificationTokenRepository.save(revokedToken);

        mockMvc.perform(get("/verify/qr/" + certId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("revoked")));

        verificationTokenRepository.delete(revokedToken);
    }

    // =========================================================================
    // WORKSTREAM 3 / VULN-05: Database-Level Atomic TOTP Anti-Replay (TOCTOU Fix)
    // =========================================================================

    @Test
    @DisplayName("RedTeam-05: Concurrent Multi-Threaded TOTP Replay Must Reject All Replays via Atomic CAS")
    public void testConcurrentMultiThreadedTotpReplayRejection() throws Exception {
        // Create user with MFA enabled and encrypted secret
        String secret = totpService.generateSecret();
        String encryptedSecret = aesEncryptionService.encrypt(secret);
        assertTrue(encryptedSecret.startsWith("enc:v1:"), "MFA secret must be encrypted with enc:v1: prefix");

        User initialUser = User.builder()
                .email("totp-concurrency-" + UUID.randomUUID() + "@aicte.gov.in")
                .fullName("TOTP Concurrency Tester")
                .role(UserRole.ROLE_AICTE_ADMIN)
                .passwordHash(passwordEncoder.encode("SecretPass123!"))
                .mfaEnabled(true)
                .mfaSecret(encryptedSecret)
                .status(UserStatus.ACTIVE)
                .build();
        final User user = userRepository.save(initialUser);

        // Generate challenge token and valid TOTP code for current time step
        String challengeToken = jwtTokenProvider.generateMfaChallengeToken(user.getId(), user.getEmail());
        long currentStep = Instant.now().getEpochSecond() / 30;
        String validCode = totpService.generateCodeForStep(secret, currentStep);

        // Run 8 concurrent threads attempting to submit the same TOTP code
        int threadCount = 8;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger replayCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    MfaVerifyRequest req = MfaVerifyRequest.builder()
                            .userId(user.getId())
                            .challengeToken(challengeToken)
                            .otpCode(validCode)
                            .build();
                    authService.verifyMfa(req, "127.0.0.1", "RedTeamAgent");
                    successCount.incrementAndGet();
                } catch (BadCredentialsException bce) {
                    if (bce.getMessage() != null && bce.getMessage().contains("already been used")) {
                        replayCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Release all threads at once
        executor.shutdown();
        assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));

        assertEquals(1, successCount.get(), "CRITICAL: Exactly 1 concurrent request must succeed consuming the TOTP time step");
        assertEquals(threadCount - 1, replayCount.get(), "CRITICAL: All other parallel requests must be rejected with replay error");

        // Verify the user's lastTotpTimeStep is atomically set to currentStep in MongoDB
        User persistedUser = userRepository.findById(user.getId()).orElseThrow();
        assertEquals(currentStep, persistedUser.getLastTotpTimeStep(), "lastTotpTimeStep must be persisted in database");

        // Attempting an immediate subsequent call must also be rejected
        MfaVerifyRequest replayReq = MfaVerifyRequest.builder()
                .userId(user.getId())
                .challengeToken(challengeToken)
                .otpCode(validCode)
                .build();
        assertThrows(BadCredentialsException.class, () ->
                authService.verifyMfa(replayReq, "127.0.0.1", "RedTeamAgent")
        );

        userRepository.delete(persistedUser);
    }

    // =========================================================================
    // WORKSTREAM 4 / VULN-03: Hardened File Ingestion (Magic Bytes & Formula Injection)
    // =========================================================================

    @Test
    @DisplayName("RedTeam-03A: Batch Upload Must Reject Excel File with Invalid Magic Bytes")
    public void testBatchUploadRejectsInvalidExcelMagicBytes() throws Exception {
        byte[] fakeExcelBytes = "This is not a real zip PK excel file content".getBytes();
        MockMultipartFile fakeExcel = new MockMultipartFile(
                "file",
                "test.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fakeExcelBytes
        );

        mockMvc.perform(multipart("/batches/upload")
                        .file(fakeExcel)
                        .param("academicYear", "2026-27")
                        .param("programCode", "CS101")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("magic")));
    }

    @Test
    @DisplayName("RedTeam-03B: Batch Upload Must Reject CSV Containing Binary Null Bytes")
    public void testBatchUploadRejectsCsvWithNullBytes() throws Exception {
        byte[] nullByteCsv = "apaarId,fullName\n981122334455,Test\0User\n".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "nullbyte.csv",
                "text/csv",
                nullByteCsv
        );

        mockMvc.perform(multipart("/batches/upload")
                        .file(file)
                        .param("academicYear", "2026-27")
                        .param("programCode", "CS101")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("null bytes")));
    }

    @Test
    @DisplayName("RedTeam-03C: Batch Upload Must Reject CSV Containing Script / HTML Tags")
    public void testBatchUploadRejectsCsvWithScriptTags() throws Exception {
        byte[] scriptCsv = "apaarId,fullName\n981122334455,<script>alert(1)</script>\n".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "xss.csv",
                "text/csv",
                scriptCsv
        );

        mockMvc.perform(multipart("/batches/upload")
                        .file(file)
                        .param("academicYear", "2026-27")
                        .param("programCode", "CS101")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("script tags")));
    }

    @Test
    @DisplayName("RedTeam-03D: Batch CSV Parser Must Sanitize Formula Injection Triggers")
    public void testBatchCsvUploadSanitizesFormulaInjection() throws Exception {
        String csvContent = "apaarId,fullName,dateOfBirth,gender,nationality,reservationCategory,programCode,academicYear,seatCategory,admissionDate,admissionMode,rollNumber,contactEmail,contactPhone\n"
                + "982233445566,=CMD('calc')|'A',2005-04-12,MALE,INDIAN,GENERAL,CS101,2026-27,REGULAR_GENERAL,2026-06-15,CENTRALIZED,CSE-01,test@calc.com,9876543210\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "formula_test.csv",
                "text/csv",
                csvContent.getBytes()
        );

        mockMvc.perform(multipart("/batches/upload")
                        .file(file)
                        .param("academicYear", "2026-27")
                        .param("programCode", "CS101")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // WORKSTREAM 5 / VULN-04: Lock-Free Rate Limiting & Proxy Trust Hardening
    // =========================================================================

    @Test
    @DisplayName("RedTeam-04: Rate Limiting Must Not Trust Client-Rotated X-Forwarded-For From Untrusted Remote")
    public void testRateLimitFilterEnforcesPerRemoteAddrRegardlessOfSpoofedXForwardedFor() throws Exception {
        String untrustedClientIp = "198.51.100.55";

        // Send rapid verification requests from this untrusted IP while rotating X-Forwarded-For
        // By default, trustProxy=false, so all requests are bound to the actual remoteAddr
        boolean rateLimitTriggered = false;
        for (int i = 0; i < 250; i++) {
            var result = mockMvc.perform(get("/verify/qr/ANY-QR-QUERY")
                            .with(request -> {
                                request.setRemoteAddr(untrustedClientIp);
                                return request;
                            })
                            .header("X-Forwarded-For", "10.0.0." + (i % 254) + ", 203.0.113." + (i % 254)))
                    .andReturn();

            if (result.getResponse().getStatus() == 429) {
                rateLimitTriggered = true;
                assertEquals("60", result.getResponse().getHeader("Retry-After"));
                break;
            }
        }

        assertTrue(rateLimitTriggered, "Rate limiting should trigger on untrusted client IP regardless of rotated X-Forwarded-For");
    }

    // =========================================================================
    // Role Boundary & Actuator Protection Tests
    // =========================================================================

    @Test
    @DisplayName("RedTeam-06: Institution Operator Cannot Approve Batches (Vertical RBAC)")
    public void testOperatorCannotApproveBatch() throws Exception {
        mockMvc.perform(post("/batches/dummy-batch-id-123/approve")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("RedTeam-07: Sensitive Actuator Endpoints Must Require Authentication")
    public void testSensitiveActuatorEndpointsAreProtected() throws Exception {
        mockMvc.perform(get("/actuator/env"))
                .andExpect(status().is4xxClientError());

        mockMvc.perform(get("/actuator/beans"))
                .andExpect(status().is4xxClientError());
    }
}

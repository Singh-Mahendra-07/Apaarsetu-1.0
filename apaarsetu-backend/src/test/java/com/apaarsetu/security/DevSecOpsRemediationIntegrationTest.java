package com.apaarsetu.security;

import com.apaarsetu.domain.Flag;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.User;
import com.apaarsetu.domain.enums.*;
import com.apaarsetu.dto.FlagResolveDTO;
import com.apaarsetu.repository.FlagRepository;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.RevokedTokenRepository;
import com.apaarsetu.repository.UserRepository;
import com.apaarsetu.security.jwt.JwtTokenProvider;
import com.apaarsetu.service.DashboardService;
import com.apaarsetu.service.GridFsStorageService;
import com.apaarsetu.service.InstitutionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: DevSecOpsRemediationIntegrationTest.java
 * Package: com.apaarsetu.security
 * Component: DevSecOpsRemediationIntegrationTest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Integration and regression test suite verifying 'DevSecOpsRemediationIntegrationTest' security, business rules, and stability.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Uses SpringBootTest, MockMvc, and embedded or test MongoDB instances.
 * 2. Asserts correct behavior for authorization, business constraints, and error envelopes.
 * 3. Serves as automated regression prevention during continuous integration builds.
 * ============================================================================
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("DevSecOps Vulnerability Remediation & Defensive Security Suite")
public class DevSecOpsRemediationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private RevokedTokenRepository revokedTokenRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private FlagRepository flagRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private InstitutionService institutionService;

    @Autowired
    private GridFsStorageService gridFsStorageService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("SEC-01: Unauthenticated request to /auth/mfa/setup is rejected with 401 Unauthorized")
    void testUnauthenticatedMfaSetupBlocked() throws Exception {
        mockMvc.perform(post("/auth/mfa/setup"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("SEC-02: Regional Officer attempting cross-zone parameter override receives 403 Forbidden")
    void testRegionalOfficerCrossZoneDashboardForbidden() throws Exception {
        UserPrincipal southOfficer = UserPrincipal.builder()
                .id("officer-south-1")
                .email("officer.south@aicte.gov.in")
                .fullName("South Regional Officer")
                .role("ROLE_AICTE_OFFICER")
                .region("SOUTH")
                .status("ACTIVE")
                .build();

        String token = jwtTokenProvider.generateAccessToken(southOfficer);

        mockMvc.perform(get("/officer/dashboard")
                        .header("Authorization", "Bearer " + token)
                        .param("zone", "NORTH"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("SEC-02: Regional Officer attempting cross-zone dossier access receives 403 Forbidden")
    void testRegionalOfficerCrossZoneDossierForbidden() throws Exception {
        // Ensure a NORTH institution exists
        String northInstId = "INST-TEST-NORTH-" + UUID.randomUUID().toString().substring(0, 6);
        Institution northInst = Institution.builder()
                .aicteId(northInstId)
                .name("Northern Institute of Technology")
                .zone(RegionZone.NORTH)
                .state("Delhi")
                .status(InstitutionStatus.APPROVED)
                .build();
        institutionRepository.save(northInst);

        UserPrincipal southOfficer = UserPrincipal.builder()
                .id("officer-south-2")
                .email("officer.south2@aicte.gov.in")
                .fullName("South Officer 2")
                .role("ROLE_AICTE_OFFICER")
                .region("SOUTH")
                .status("ACTIVE")
                .build();

        String token = jwtTokenProvider.generateAccessToken(southOfficer);

        mockMvc.perform(get("/officer/institutions/" + northInstId + "/dossier")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("SEC-03: IDOR prevention on dispute flag evidence download (403 Forbidden for cross-institution)")
    void testDisputeFlagEvidenceCrossTenantForbidden() throws Exception {
        String flagId = "FLAG-TEST-" + UUID.randomUUID().toString().substring(0, 6);
        Flag flag = Flag.builder()
                .id(flagId)
                .primaryInstitutionId("INST-A")
                .conflictingInstitutionId("INST-B")
                .apaarId("984512349999")
                .status(FlagStatus.PENDING)
                .build();
        flagRepository.save(flag);

        UserPrincipal instCAdmin = UserPrincipal.builder()
                .id("admin-inst-c")
                .email("admin@inst-c.edu")
                .fullName("Admin Inst C")
                .role("ROLE_INSTITUTION_ADMIN")
                .institutionId("INST-C")
                .status("ACTIVE")
                .build();

        String token = jwtTokenProvider.generateAccessToken(instCAdmin);

        mockMvc.perform(get("/flags/" + flagId + "/evidence/some_evidence.pdf")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("SEC-05: Spoofed MIME-type upload rejected via binary magic-byte verification (400 Bad Request)")
    void testSpoofedMimeTypeUploadRejected() {
        // Text payload claiming to be application/pdf without %PDF- magic bytes
        byte[] fakePdfBytes = "MZ\u0090\u0000\u0003\u0000\u0000\u0000FakeExecutable".getBytes();
        MockMultipartFile spoofedFile = new MockMultipartFile(
                "file",
                "malicious.pdf",
                "application/pdf",
                fakePdfBytes
        );

        com.apaarsetu.common.exception.BadRequestException ex = assertThrows(
                com.apaarsetu.common.exception.BadRequestException.class,
                () -> gridFsStorageService.storeFile(spoofedFile, "STUDENT-1", "uploader@example.com")
        );
        assertTrue(ex.getMessage().contains("File content signature does not match PDF format"));
    }

    @Test
    @DisplayName("SEC-05: Genuine PDF magic bytes pass validation successfully")
    void testGenuinePdfMagicBytesAccepted() {
        byte[] genuinePdfBytes = "%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF".getBytes();
        MockMultipartFile validPdf = new MockMultipartFile(
                "file",
                "genuine.pdf",
                "application/pdf",
                genuinePdfBytes
        );

        String storedName = gridFsStorageService.storeFile(validPdf, "STUDENT-GENUINE", "uploader@example.com");
        assertNotNull(storedName);
        assertTrue(storedName.contains("genuine.pdf"));
    }

    @Test
    @DisplayName("SEC-06: Regex special characters in state search are quoted safely without ReDoS")
    void testRegexSpecialCharactersSafeInSearch() {
        assertDoesNotThrow(() -> {
            institutionService.getInstitutions(".*.*.*)++", null, null, null, Pageable.ofSize(10));
        });
    }

    @Test
    @DisplayName("SEC-07: Sensitive User credential fields omitted during JSON serialization")
    void testSensitiveUserFieldsOmittedFromSerialization() throws Exception {
        User sensitiveUser = User.builder()
                .id("user-secret-test")
                .email("security.test@example.com")
                .passwordHash("$2a$10$hashedPasswordHere1234567890")
                .mfaSecret("JBSWY3DPEHPK3PXP")
                .failedLoginAttempts(3)
                .build();

        String json = objectMapper.writeValueAsString(sensitiveUser);

        assertFalse(json.contains("passwordHash"), "passwordHash must never appear in serialized JSON");
        assertFalse(json.contains("secondaryPasswordHash"), "secondaryPasswordHash must never appear in serialized JSON");
        assertFalse(json.contains("mfaSecret"), "mfaSecret must never appear in serialized JSON");
        assertFalse(json.contains("failedLoginAttempts"), "failedLoginAttempts must never appear in serialized JSON");
        assertTrue(json.contains("security.test@example.com"));
    }

    @Test
    @DisplayName("SEC-09: Resolving an already resolved dispute flag is rejected (state machine protection)")
    void testDoubleResolutionRejected() {
        String flagId = "FLAG-RESOLVE-" + UUID.randomUUID().toString().substring(0, 6);
        Flag flag = Flag.builder()
                .id(flagId)
                .primaryInstitutionId("INST-1")
                .apaarId("984512348888")
                .status(FlagStatus.RESOLVED)
                .build();
        flagRepository.save(flag);

        UserPrincipal admin = UserPrincipal.builder()
                .id("admin-aicte")
                .email("admin@aicte.gov.in")
                .role("ROLE_AICTE_ADMIN")
                .build();

        FlagResolveDTO dto = FlagResolveDTO.builder()
                .resolution("APPROVE_TRANSFER")
                .notes("Re-resolving closed dispute")
                .build();

        com.apaarsetu.common.exception.BadRequestException ex = assertThrows(
                com.apaarsetu.common.exception.BadRequestException.class,
                () -> dashboardService.resolveFlag(flagId, dto, admin, "127.0.0.1", "TestAgent")
        );
        assertTrue(ex.getMessage().contains("already been resolved"));
    }

    @Test
    @DisplayName("SEC-04: Malformed request body returns 400 Bad Request with sanitized message")
    void testMalformedJsonReturnsSanitizedError() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid_json: true,"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.data.message").value("Malformed or unreadable JSON payload provided in request body."));
    }
}

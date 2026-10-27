package com.apaarsetu.repository;

import com.apaarsetu.domain.*;
import com.apaarsetu.domain.enums.*;
import com.apaarsetu.dto.CapacityViolationDTO;
import com.apaarsetu.dto.NationalDashboardDTO;
import com.apaarsetu.service.DashboardService;
import com.apaarsetu.service.GridFsStorageService;
import org.bson.Document;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: MongoPersistenceIntegrationTest.java
 * Package: com.apaarsetu.repository
 * Component: MongoPersistenceIntegrationTest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Integration and regression test suite verifying 'MongoPersistenceIntegrationTest' security, business rules, and stability.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Uses SpringBootTest, MockMvc, and embedded or test MongoDB instances.
 * 2. Asserts correct behavior for authorization, business constraints, and error envelopes.
 * 3. Serves as automated regression prevention during continuous integration builds.
 * ============================================================================
 */
@SpringBootTest
@DisplayName("MongoDB Integration & Database Persistence Verification Suite")
public class MongoPersistenceIntegrationTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FlagRepository flagRepository;

    @Autowired
    private UploadBatchRepository batchRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private UserPreferenceRepository userPreferenceRepository;

    @Autowired
    private GridFsStorageService gridFsStorageService;

    @Autowired
    private DashboardService dashboardService;

    @Test
    @DisplayName("1. Verify MongoDB live connection and database ping")
    void testMongoConnectionAndPing() {
        assertNotNull(mongoTemplate, "MongoTemplate must be injected");
        Document pingResult = mongoTemplate.executeCommand(new Document("ping", 1));
        assertNotNull(pingResult, "Ping result must not be null");
        assertEquals(1.0, ((Number) pingResult.get("ok")).doubleValue(), 0.01, "MongoDB ping should return ok: 1.0");
        assertTrue(mongoTemplate.collectionExists("users"), "Collection 'users' must exist");
        assertTrue(mongoTemplate.collectionExists("institutions"), "Collection 'institutions' must exist");
        assertTrue(mongoTemplate.collectionExists("students"), "Collection 'students' must exist");
    }

    @Test
    @DisplayName("2. Verify User entity creation, persistence, update, and retrieval")
    void testUserPersistence() {
        String email = "test.user." + UUID.randomUUID() + "@aicte.gov.in";
        User user = User.builder()
                .email(email)
                .fullName("Test Security Officer")
                .role(UserRole.ROLE_AICTE_OFFICER)
                .region(RegionZone.NORTH)
                .passwordHash("$2a$12$e7.dummyHashForTestingPersistenceOnly")
                .status(UserStatus.ACTIVE)
                .mfaEnabled(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User saved = userRepository.save(user);
        assertNotNull(saved.getId(), "Generated MongoDB ID must not be null");

        // Read back from database
        Optional<User> fetchedOpt = userRepository.findByEmail(email);
        assertTrue(fetchedOpt.isPresent(), "Saved user must be retrievable by email");
        User fetched = fetchedOpt.get();
        assertEquals("Test Security Officer", fetched.getFullName());
        assertEquals(UserRole.ROLE_AICTE_OFFICER, fetched.getRole());
        assertEquals(RegionZone.NORTH, fetched.getRegion());

        // Update user
        fetched.setFullName("Updated Security Officer");
        fetched.setMfaEnabled(true);
        userRepository.save(fetched);

        User reFetched = userRepository.findById(saved.getId()).orElseThrow();
        assertEquals("Updated Security Officer", reFetched.getFullName());
        assertTrue(reFetched.isMfaEnabled());

        // Clean up test document
        userRepository.deleteById(saved.getId());
        assertFalse(userRepository.findById(saved.getId()).isPresent());
    }

    @Test
    @DisplayName("3. Verify Institution persistence, approved programs, and ERP API keys")
    void testInstitutionPersistence() {
        String aicteId = "AICTE-TEST-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        Institution.ApprovedProgram prog = Institution.ApprovedProgram.builder()
                .programCode("ME101")
                .programName("Mechanical Engineering")
                .level("UNDERGRADUATE")
                .approvedIntake(60)
                .academicYear("2026-27")
                .build();

        Institution.ErpApiKey key = Institution.ErpApiKey.builder()
                .keyId("erp-test-key-01")
                .label("Campus Test ERP")
                .keyHash("$2a$12$dummyKeyHashForPersistence")
                .createdAt(Instant.now())
                .active(true)
                .build();

        Institution inst = Institution.builder()
                .aicteId(aicteId)
                .name("National Engineering Academy")
                .type(InstitutionType.ENGINEERING)
                .state("Karnataka")
                .city("Bengaluru")
                .zone(RegionZone.SOUTH)
                .universityAffiliation("VTU")
                .status(InstitutionStatus.APPROVED)
                .approvedPrograms(new ArrayList<>(List.of(prog)))
                .erpApiKeys(new ArrayList<>(List.of(key)))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Institution saved = institutionRepository.save(inst);
        assertNotNull(saved.getId());

        // Read back from database
        Institution fetched = institutionRepository.findByAicteId(aicteId).orElseThrow();
        assertEquals("National Engineering Academy", fetched.getName());
        assertEquals(RegionZone.SOUTH, fetched.getZone());
        assertEquals(1, fetched.getApprovedPrograms().size());
        assertEquals("ME101", fetched.getApprovedPrograms().get(0).getProgramCode());
        assertEquals(1, fetched.getErpApiKeys().size());

        // Clean up test institution
        institutionRepository.deleteById(saved.getId());
    }

    @Test
    @DisplayName("4. Verify Student registration, embedded documents, and retrieval by APAAR ID")
    void testStudentPersistence() {
        String testApaar = "98" + UUID.randomUUID().toString().replaceAll("[^0-9]", "").substring(0, 10);
        Student student = Student.builder()
                .apaarId(testApaar)
                .institutionId("AICTE-INST-1001")
                .programCode("CS101")
                .academicYear("2026-27")
                .seatCategory(SeatCategory.REGULAR_GENERAL)
                .admissionStatus(AdmissionStatus.PROVISIONAL)
                .validationStatus(ValidationStatus.VALIDATED)
                .personalInfo(Student.PersonalInfo.builder()
                        .fullName("Ananya Deshmukh")
                        .dateOfBirth("2005-09-15")
                        .gender(Gender.FEMALE)
                        .nationality(Nationality.INDIAN)
                        .reservationCategory(ReservationCategory.GENERAL)
                        .aadhaarLastFour("1234")
                        .build())
                .admissionDetails(Student.AdmissionDetails.builder()
                        .admissionDate("2026-06-18")
                        .admissionMode(AdmissionMode.CENTRALIZED)
                        .rollNumber("CSE-TEST-001")
                        .build())
                .evidenceFiles(new ArrayList<>())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Student saved = studentRepository.save(student);
        assertNotNull(saved.getId());

        // Read back
        Student fetched = studentRepository.findByApaarId(testApaar).orElseThrow();
        assertEquals("Ananya Deshmukh", fetched.getPersonalInfo().getFullName());
        assertEquals(SeatCategory.REGULAR_GENERAL, fetched.getSeatCategory());
        assertEquals("AICTE-INST-1001", fetched.getInstitutionId());

        // Clean up
        studentRepository.deleteById(saved.getId());
    }

    @Test
    @DisplayName("5. Verify Dispute Flag creation, adjudication, and persistence")
    void testFlagCreationAndResolution() {
        Flag flag = Flag.builder()
                .apaarId("999888777666")
                .studentName("Disputed Candidate")
                .flagType(FlagType.DUPLICATE_CONCURRENT_ENROLLMENT)
                .severity(FlagSeverity.CRITICAL)
                .primaryInstitutionId("AICTE-INST-1001")
                .primaryInstitutionName("Delhi Institute of Technology & Management")
                .conflictingInstitutionId("AICTE-INST-1002")
                .conflictingInstitutionName("Mumbai Metropolitan College of Engineering")
                .status(FlagStatus.PENDING)
                .notes("Concurrent active enrollment detected across northern and western zones.")
                .createdAt(Instant.now())
                .build();

        Flag saved = flagRepository.save(flag);
        assertNotNull(saved.getId());

        // Read back
        Flag fetched = flagRepository.findById(saved.getId()).orElseThrow();
        assertEquals(FlagStatus.PENDING, fetched.getStatus());
        assertEquals(FlagSeverity.CRITICAL, fetched.getSeverity());

        // Resolve
        fetched.setStatus(FlagStatus.RESOLVED);
        fetched.setResolution(FlagResolution.VERIFIED_GENUINE);
        fetched.setResolvedBy("officer@aicte.gov.in");
        fetched.setResolvedAt(Instant.now());
        flagRepository.save(fetched);

        Flag resolved = flagRepository.findById(saved.getId()).orElseThrow();
        assertEquals(FlagStatus.RESOLVED, resolved.getStatus());
        assertEquals(FlagResolution.VERIFIED_GENUINE, resolved.getResolution());

        // Clean up
        flagRepository.deleteById(saved.getId());
    }

    @Test
    @DisplayName("6. Verify UploadBatch persistence with row-level errors and summary embed")
    void testUploadBatchPersistence() {
        UploadBatch.BatchErrorEmbed error = UploadBatch.BatchErrorEmbed.builder()
                .rowNumber(1)
                .apaarId("1234")
                .studentName("Bad Format Student")
                .fieldName("apaarId")
                .ruleCode("INVALID_FORMAT")
                .errorMessage("APAAR ID must be 12 numeric digits")
                .build();

        UploadBatch batch = UploadBatch.builder()
                .institutionId("AICTE-INST-1001")
                .academicYear("2026-27")
                .programCode("CS101")
                .fileName("test_batch.csv")
                .fileHash("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
                .totalRows(10)
                .status(BatchStatus.FLAGGED)
                .uploadedBy("operator@ditm.ac.in")
                .summary(UploadBatch.BatchSummaryEmbed.builder()
                        .totalRows(10)
                        .accepted(9)
                        .formatErrors(1)
                        .build())
                .errors(List.of(error))
                .createdAt(Instant.now())
                .build();

        UploadBatch saved = batchRepository.save(batch);
        assertNotNull(saved.getId());

        UploadBatch fetched = batchRepository.findById(saved.getId()).orElseThrow();
        assertEquals(BatchStatus.FLAGGED, fetched.getStatus());
        assertEquals(1, fetched.getErrors().size());
        assertEquals("INVALID_FORMAT", fetched.getErrors().get(0).getRuleCode());
        assertEquals(9, fetched.getSummary().getAccepted());

        batchRepository.deleteById(saved.getId());
    }

    @Test
    @DisplayName("7. Verify VerificationToken issuance, persistence, and lookup")
    void testVerificationTokenPersistence() {
        String tokenHash = "token_hash_" + UUID.randomUUID();
        String certId = "CERT-TEST-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        VerificationToken token = VerificationToken.builder()
                .tokenHash(tokenHash)
                .certificateId(certId)
                .apaarId("912345678901")
                .studentName("Aarav Sharma")
                .institutionName("Delhi Institute of Technology & Management")
                .aicteCode("AICTE-INST-1001")
                .degree("B.Tech")
                .branch("CS101")
                .sealStatus("CRYPTOGRAPHICALLY_SEALED")
                .verificationMethod("QR")
                .requestedBy("test-verifier")
                .verifiedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(86400))
                .build();

        VerificationToken saved = verificationTokenRepository.save(token);
        assertNotNull(saved.getId());

        VerificationToken fetched = verificationTokenRepository.findByCertificateId(certId).orElseThrow();
        assertEquals("Aarav Sharma", fetched.getStudentName());
        assertEquals("CRYPTOGRAPHICALLY_SEALED", fetched.getSealStatus());

        verificationTokenRepository.deleteById(saved.getId());
    }

    @Test
    @DisplayName("8. Verify GridFS document storage, retrieval, and cleanup")
    void testGridFsStorage() throws Exception {
        byte[] pdfContent = "%PDF-1.4\n1 0 obj\n<< /Title (Test Verification Document) >>\nendobj\ntrailer\n<<>>\n%%EOF".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "evidence_doc.pdf", "application/pdf", pdfContent);

        String storedFilename = gridFsStorageService.storeFile(file, "test-student-id", "test-user@aicte.gov.in");
        assertNotNull(storedFilename, "Stored filename must be generated");

        // Retrieve resource
        GridFsResource resource = gridFsStorageService.getFile(storedFilename);
        assertNotNull(resource);
        assertTrue(resource.exists(), "Resource must exist in GridFS");
        assertEquals("application/pdf", resource.getContentType());

        try (InputStream is = resource.getInputStream()) {
            byte[] readBytes = is.readAllBytes();
            assertArrayEquals(pdfContent, readBytes, "Retrieved bytes must match stored bytes");
        }

        // Clean up
        gridFsStorageService.deleteFile(storedFilename);
    }

    @Test
    @DisplayName("9. Verify System Settings and User Preferences persistence")
    void testSystemSettingsAndUserPreferences() {
        SystemSetting setting = systemSettingRepository.findById("GLOBAL").orElse(null);
        assertNotNull(setting, "GLOBAL system setting must be initialized");
        assertTrue(setting.getRequestsPerMinute() > 0);

        String userId = "test-user-" + UUID.randomUUID();
        UserPreference pref = UserPreference.builder()
                .userId(userId)
                .emailAlerts(true)
                .criticalFlagSms(true)
                .dailyDigest(false)
                .updatedAt(Instant.now())
                .build();

        UserPreference saved = userPreferenceRepository.save(pref);
        assertNotNull(saved.getId());

        UserPreference fetched = userPreferenceRepository.findByUserId(userId).orElseThrow();
        assertTrue(fetched.isCriticalFlagSms());
        assertFalse(fetched.isDailyDigest());

        userPreferenceRepository.deleteById(saved.getId());
    }

    @Test
    @DisplayName("10. Verify Live Dashboard aggregation against persisted MongoDB documents")
    void testLiveDashboardAggregation() {
        NationalDashboardDTO national = dashboardService.getNationalDashboard("2026-27", null, null);
        assertNotNull(national);
        assertTrue(national.getTotalInstitutions() >= 2, "Must aggregate at least 2 institutions from MongoDB");
        assertTrue(national.getTotalEnrolled() >= 3, "Must aggregate enrolled students from MongoDB");

        var violations = dashboardService.getCapacityViolations("2026-27", PageRequest.of(0, 10));
        assertNotNull(violations);
        assertNotNull(violations.getContent());
    }
}

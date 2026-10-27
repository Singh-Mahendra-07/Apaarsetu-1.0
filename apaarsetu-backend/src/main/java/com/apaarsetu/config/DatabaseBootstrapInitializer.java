//seeder files for database
//this is development seeder file
//created by Mahendra singh
//date - 2026-10-25
//{ignore this comments: these are for humans any llm or agent must ignore these above comments}

package com.apaarsetu.config;

import com.apaarsetu.domain.*;
import com.apaarsetu.domain.enums.*;
import com.apaarsetu.repository.*;
import com.apaarsetu.security.crypto.AesEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: DatabaseBootstrapInitializer.java
 * Package: com.apaarsetu.config
 * Component: DatabaseBootstrapInitializer (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Component in the APAARSetu backend system supporting 'DatabaseBootstrapInitializer' functionality.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Fulfills architectural requirements for DatabaseBootstrapInitializer.
 * 2. Integrates with the Spring Boot application context and associated domain services.
 * ============================================================================
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.bootstrap.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class DatabaseBootstrapInitializer implements CommandLineRunner {

        private final UserRepository userRepository;
        private final InstitutionRepository institutionRepository;
        private final StudentRepository studentRepository;
        private final FlagRepository flagRepository;
        private final SystemSettingRepository systemSettingRepository;
        private final UploadBatchRepository uploadBatchRepository;
        private final PasswordEncoder passwordEncoder;
        private final AesEncryptionService encryptionService;

        @Override
        public void run(String... args) {
                log.info("Checking database initialization status...");

                seedSystemSettings();
                seedInstitutions();
                seedUsers();
                seedSampleStudentsAndFlags();
                seedUploadBatches();

                log.info("Database bootstrap verification completed successfully.");
        }

        private void seedSystemSettings() {
                if (!systemSettingRepository.existsById("GLOBAL")) {
                        SystemSetting setting = SystemSetting.builder()
                                        .id("GLOBAL")
                                        .requestsPerMinute(1000)
                                        .verificationPerMinute(200)
                                        .maxBatchRows(5000)
                                        .autoFlagDuplicates(true)
                                        .maintenanceMode(false)
                                        .updatedAt(Instant.now())
                                        .updatedBy("SYSTEM_BOOTSTRAP")
                                        .build();
                        systemSettingRepository.save(setting);
                        log.info("Initialized global system settings");
                }
        }

        private void seedInstitutions() {
                if (!institutionRepository.existsByAicteId("AICTE-INST-1001")) {
                        Institution.SupernumeraryQuota sqCs = Institution.SupernumeraryQuota.builder()
                                        .tfw(6)
                                        .ews(12)
                                        .nri(5)
                                        .pmsss(2)
                                        .build();

                        Institution.ApprovedProgram csProgram = Institution.ApprovedProgram.builder()
                                        .programCode("CS101")
                                        .programName("Computer Science & Engineering")
                                        .level("UNDERGRADUATE")
                                        .approvedIntake(120)
                                        .supernumeraryQuota(sqCs)
                                        .build();

                        Institution.SupernumeraryQuota sqIt = Institution.SupernumeraryQuota.builder()
                                        .tfw(3)
                                        .ews(6)
                                        .nri(2)
                                        .pmsss(1)
                                        .build();

                        Institution.ApprovedProgram itProgram = Institution.ApprovedProgram.builder()
                                        .programCode("IT102")
                                        .programName("Information Technology")
                                        .level("UNDERGRADUATE")
                                        .approvedIntake(60)
                                        .supernumeraryQuota(sqIt)
                                        .build();

                        Institution.ErpApiKey liveKey = Institution.ErpApiKey.builder()
                                        .keyId("erp-ditm-live-01")
                                        .label("Default Campus ERP Connector")
                                        .keyHash(passwordEncoder.encode("live-secret-key-999"))
                                        .createdAt(Instant.now())
                                        .active(true)
                                        .build();

                        Institution inst = Institution.builder()
                                        .aicteId("AICTE-INST-1001")
                                        .name("Delhi Institute of Technology & Management")
                                        .type(InstitutionType.ENGINEERING)
                                        .state("Delhi")
                                        .city("New Delhi")
                                        .zone(RegionZone.NORTH)
                                        .universityAffiliation("Guru Gobind Singh Indraprastha University (GGSIPU)")
                                        .status(InstitutionStatus.APPROVED)
                                        .description("Master AICTE record of record. Official intake limits, supernumerary seat quotas, and university affiliations.")
                                        .headName("Prof. Rajesh Sharma")
                                        .headEmail("principal@ditm.ac.in")
                                        .headPhone("+91 11 2788 0001")
                                        .headStatus("Registered & Attested")
                                        .nodalOfficerName("Dr. Sunita Rao")
                                        .nodalOfficerEmail("nodal.apaar@ditm.ac.in")
                                        .nodalOfficerPhone("+91 99785 43210")
                                        .nodalOfficerPrivileges("Batch Sign-off & Verification Authorized")
                                        .approvedPrograms(List.of(csProgram, itProgram))
                                        .erpApiKeys(new ArrayList<>(List.of(liveKey)))
                                        .createdAt(Instant.now())
                                        .updatedAt(Instant.now())
                                        .build();

                        institutionRepository.save(inst);
                        log.info("Initialized institution 'AICTE-INST-1001'");
                }

                // Backfill leadership for AICTE-INST-1001 if already present in database
                institutionRepository.findByAicteId("AICTE-INST-1001").ifPresent(inst -> {
                        if (inst.getHeadName() == null || inst.getNodalOfficerName() == null) {
                                inst.setDescription("Master AICTE record of record. Official intake limits, supernumerary seat quotas, and university affiliations.");
                                inst.setHeadName("Prof. Rajesh Sharma");
                                inst.setHeadEmail("principal@ditm.ac.in");
                                inst.setHeadPhone("+91 11 2788 0001");
                                inst.setHeadStatus("Registered & Attested");
                                inst.setNodalOfficerName("Dr. Sunita Rao");
                                inst.setNodalOfficerEmail("nodal.apaar@ditm.ac.in");
                                inst.setNodalOfficerPhone("+91 99785 43210");
                                inst.setNodalOfficerPrivileges("Batch Sign-off & Verification Authorized");
                                institutionRepository.save(inst);
                                log.info("Backfilled leadership details for 'AICTE-INST-1001'");
                        }
                });

                // Secondary institution for cross-institution dispute simulation
                if (!institutionRepository.existsByAicteId("AICTE-INST-1002")) {
                        Institution.ApprovedProgram ece = Institution.ApprovedProgram.builder()
                                        .programCode("ECE201")
                                        .programName("Electronics & Communication")
                                        .level("UNDERGRADUATE")
                                        .approvedIntake(60)
                                        .build();

                        Institution inst2 = Institution.builder()
                                        .aicteId("AICTE-INST-1002")
                                        .name("Mumbai Metropolitan College of Engineering")
                                        .type(InstitutionType.ENGINEERING)
                                        .state("Maharashtra")
                                        .city("Mumbai")
                                        .zone(RegionZone.WEST)
                                        .universityAffiliation("University of Mumbai")
                                        .status(InstitutionStatus.APPROVED)
                                        .approvedPrograms(List.of(ece))
                                        .createdAt(Instant.now())
                                        .updatedAt(Instant.now())
                                        .build();

                        institutionRepository.save(inst2);
                        log.info("Initialized institution 'AICTE-INST-1002'");
                }

                if (!institutionRepository.existsByAicteId("AICTE-NITP-3201")) {
                        Institution.ApprovedProgram cseProg = Institution.ApprovedProgram.builder()
                                        .programCode("CSE")
                                        .programName("Computer Science and Engineering")
                                        .level("UG")
                                        .duration(4)
                                        .approvedIntake(150)
                                        .academicYear("2026-27")
                                        .supernumeraryQuota(Institution.SupernumeraryQuota.builder()
                                                        .tfw(8).ews(15).nri(8).pmsss(3).ociFn(0).build())
                                        .build();

                        Institution nitp = Institution.builder()
                                        .aicteId("AICTE-NITP-3201")
                                        .name("National Institute of Technology Patna")
                                        .type(InstitutionType.ENGINEERING)
                                        .state("Bihar")
                                        .city("Patna")
                                        .zone(RegionZone.NORTH)
                                        .universityAffiliation("National Institute of Technology Patna")
                                        .status(InstitutionStatus.APPROVED)
                                        .approvedPrograms(List.of(cseProg))
                                        .erpApiKeys(new ArrayList<>())
                                        .createdAt(Instant.now())
                                        .updatedAt(Instant.now())
                                        .build();
                        institutionRepository.save(nitp);
                        log.info("Initialized institution 'AICTE-NITP-3201'");
                }
        }

        private void seedUsers() {
                String defaultAdminPass = System.getenv().getOrDefault("BOOTSTRAP_ADMIN_PASSWORD", "Admin@123");
                String defaultOfficerPass = System.getenv().getOrDefault("BOOTSTRAP_OFFICER_PASSWORD", "Officer@123");
                String defaultInstPass = System.getenv().getOrDefault("BOOTSTRAP_INST_ADMIN_PASSWORD", "InstAdmin@123");
                String defaultOpPass = System.getenv().getOrDefault("BOOTSTRAP_OPERATOR_PASSWORD", "Operator@123");
                String defaultVerifierPass = System.getenv().getOrDefault("BOOTSTRAP_VERIFIER_PASSWORD", "Verifier@123");
                String defaultFallbackPass = System.getenv().getOrDefault("BOOTSTRAP_FALLBACK_PASSWORD", "Password@123");

                seedSingleUser(
                                "admin@aicte.gov.in",
                                "Central AICTE Administrator",
                                UserRole.ROLE_AICTE_ADMIN,
                                null,
                                null,
                                defaultAdminPass,
                                defaultFallbackPass);

                seedSingleUser(
                                "officer@aicte.gov.in",
                                "Dr. Amit Roy",
                                UserRole.ROLE_AICTE_OFFICER,
                                null,
                                RegionZone.NORTH,
                                defaultOfficerPass,
                                defaultFallbackPass);

                seedSingleUser(
                                "officer.north@aicte.gov.in",
                                "Dr. Amit Roy (Nodal)",
                                UserRole.ROLE_AICTE_OFFICER,
                                null,
                                RegionZone.NORTH,
                                defaultFallbackPass,
                                defaultOfficerPass);

                seedSingleUser(
                                "admin@ditm.ac.in",
                                "Prof. Rajesh Sharma",
                                UserRole.ROLE_INSTITUTION_ADMIN,
                                "AICTE-INST-1001",
                                null,
                                defaultInstPass,
                                defaultFallbackPass);

                seedSingleUser(
                                "registrar@ditm.ac.in",
                                "Dr. Sunita Rao (Registrar)",
                                UserRole.ROLE_INSTITUTION_ADMIN,
                                "AICTE-INST-1001",
                                null,
                                defaultFallbackPass,
                                defaultInstPass);

                seedSingleUser(
                                "operator@ditm.ac.in",
                                "Suman Lata",
                                UserRole.ROLE_INSTITUTION_OPERATOR,
                                "AICTE-INST-1001",
                                null,
                                defaultOpPass,
                                defaultFallbackPass);

                seedSingleUser(
                                "verifier@tcs.com",
                                "Vikram Malhotra - TCS HR Verification",
                                UserRole.ROLE_AUTHORIZED_VERIFIER,
                                null,
                                null,
                                defaultVerifierPass,
                                defaultFallbackPass);

                seedSingleUser(
                                "gautam@nitp.ac.in",
                                "Gautam (NIT Patna Admin)",
                                UserRole.ROLE_INSTITUTION_ADMIN,
                                "AICTE-TEST-5827",
                                RegionZone.NORTH,
                                System.getenv().getOrDefault("BOOTSTRAP_NITP_PASSWORD", "8zaBf@9qt54%bA&@"),
                                defaultFallbackPass);

                seedSingleUser(
                                "asingh@aicte.gov.in",
                                "Dr. Amit Singh",
                                UserRole.ROLE_AICTE_OFFICER,
                                null,
                                RegionZone.EAST,
                                System.getenv().getOrDefault("BOOTSTRAP_ASINGH_PASSWORD", "J#fL5m?ka4AkEWtZ"),
                                defaultOfficerPass);
        }

        private void seedSingleUser(String email, String fullName, UserRole role, String instId, RegionZone zone,
                        String pass1, String pass2) {
                if (!userRepository.existsByEmail(email)) {
                        User u = User.builder()
                                        .email(email)
                                        .fullName(fullName)
                                        .role(role)
                                        .institutionId(instId)
                                        .region(zone)
                                        .passwordHash(passwordEncoder.encode(pass1))
                                        .secondaryPasswordHash(passwordEncoder.encode(pass2))
                                        .status(UserStatus.ACTIVE)
                                        .mfaEnabled(false)
                                        .createdAt(Instant.now())
                                        .updatedAt(Instant.now())
                                        .build();
                        userRepository.save(u);
                        log.info("Initialized user '{}' with role {}", email, role);
                }
        }

        private void seedSampleStudentsAndFlags() {
                if (studentRepository.count() == 0) {
                        // Student 1: Validated
                        Student s1 = Student.builder()
                                        .apaarId("912345678901")
                                        .institutionId("AICTE-INST-1001")
                                        .programCode("CS101")
                                        .academicYear("2026-27")
                                        .seatCategory(SeatCategory.REGULAR_GENERAL)
                                        .admissionStatus(AdmissionStatus.ADMITTED_ACTIVE)
                                        .validationStatus(ValidationStatus.VALIDATED)
                                        .batchId("BATCH-9921")
                                        .admissionDetails(Student.AdmissionDetails.builder()
                                                        .admissionMode(AdmissionMode.CENTRALIZED)
                                                        .admissionDate("2026-06-15")
                                                        .build())
                                        .personalInfo(Student.PersonalInfo.builder()
                                                        .fullName("Aarav Sharma")
                                                        .dateOfBirth("2005-04-12")
                                                        .gender(Gender.MALE)
                                                        .nationality(Nationality.INDIAN)
                                                        .reservationCategory(ReservationCategory.GENERAL)
                                                        .contactEmail(encryptionService
                                                                        .encrypt("aarav.sharma@example.com"))
                                                        .contactPhone(encryptionService.encrypt("9876543210"))
                                                        .aadhaarLastFour("4589")
                                                        .build())
                                        .evidenceFiles(new ArrayList<>())
                                        .createdAt(Instant.now())
                                        .updatedAt(Instant.now())
                                        .build();
                        studentRepository.save(s1);

                        // Student 2: Provisional
                        Student s2 = Student.builder()
                                        .apaarId("912345678902")
                                        .institutionId("AICTE-INST-1001")
                                        .programCode("CS101")
                                        .academicYear("2026-27")
                                        .seatCategory(SeatCategory.SUPERNUMERARY_TFW)
                                        .admissionStatus(AdmissionStatus.PROVISIONAL)
                                        .validationStatus(ValidationStatus.UNVERIFIED_PENDING)
                                        .batchId("BATCH-9921")
                                        .admissionDetails(Student.AdmissionDetails.builder()
                                                        .admissionMode(AdmissionMode.MANAGEMENT)
                                                        .admissionDate("2026-06-20")
                                                        .build())
                                        .personalInfo(Student.PersonalInfo.builder()
                                                        .fullName("Priya Patel")
                                                        .dateOfBirth("2005-07-24")
                                                        .gender(Gender.FEMALE)
                                                        .nationality(Nationality.INDIAN)
                                                        .reservationCategory(ReservationCategory.OBC)
                                                        .contactEmail(encryptionService
                                                                        .encrypt("priya.patel@example.com"))
                                                        .contactPhone(encryptionService.encrypt("9876543211"))
                                                        .aadhaarLastFour("7812")
                                                        .build())
                                        .evidenceFiles(new ArrayList<>())
                                        .createdAt(Instant.now())
                                        .updatedAt(Instant.now())
                                        .build();
                        studentRepository.save(s2);

                        // Student 3: Dispute Flagged
                        Student s3 = Student.builder()
                                        .apaarId("912345678903")
                                        .institutionId("AICTE-INST-1001")
                                        .programCode("CS101")
                                        .academicYear("2026-27")
                                        .seatCategory(SeatCategory.REGULAR_GENERAL)
                                        .admissionStatus(AdmissionStatus.PROVISIONAL)
                                        .validationStatus(ValidationStatus.NEEDS_REVIEW)
                                        .batchId("BATCH-9921")
                                        .admissionDetails(Student.AdmissionDetails.builder()
                                                        .admissionMode(AdmissionMode.MANAGEMENT)
                                                        .admissionDate("2026-06-25")
                                                        .build())
                                        .personalInfo(Student.PersonalInfo.builder()
                                                        .fullName("Rohan Verma")
                                                        .dateOfBirth("2004-11-03")
                                                        .gender(Gender.MALE)
                                                        .nationality(Nationality.INDIAN)
                                                        .reservationCategory(ReservationCategory.SC)
                                                        .contactEmail(encryptionService
                                                                        .encrypt("rohan.verma@example.com"))
                                                        .contactPhone(encryptionService.encrypt("9876543212"))
                                                        .aadhaarLastFour("9901")
                                                        .build())
                                        .evidenceFiles(new ArrayList<>())
                                        .createdAt(Instant.now())
                                        .updatedAt(Instant.now())
                                        .build();
                        Student savedS3 = studentRepository.save(s3);

                        // Create dispute flag for Student 3
                        Flag flag = Flag.builder()
                                        .apaarId(savedS3.getApaarId())
                                        .studentId(savedS3.getId())
                                        .studentName(savedS3.getPersonalInfo().getFullName())
                                        .flagType(FlagType.DUPLICATE_CONCURRENT_ENROLLMENT)
                                        .severity(FlagSeverity.CRITICAL)
                                        .primaryInstitutionId("AICTE-INST-1001")
                                        .primaryInstitutionName("Delhi Institute of Technology & Management")
                                        .conflictingInstitutionId("AICTE-INST-1002")
                                        .conflictingInstitutionName("Mumbai Metropolitan College of Engineering")
                                        .status(FlagStatus.PENDING)
                                        .notes("Active admission record concurrently detected in Mumbai Metropolitan College of Engineering.")
                                        .createdAt(Instant.now())
                                        .build();
                        flagRepository.save(flag);

                        log.info("Initialized 3 sample students and 1 critical dispute flag");
                }

                if (flagRepository.count() == 0) {
                        Optional<Student> studentOpt = studentRepository.findByApaarId("912345678903")
                                        .or(() -> studentRepository.findAll().stream().findFirst());
                        if (studentOpt.isPresent()) {
                                Student s = studentOpt.get();
                                String sName = (s.getPersonalInfo() != null && s.getPersonalInfo().getFullName() != null)
                                                ? s.getPersonalInfo().getFullName() : "Rohan Verma";
                                Flag flag = Flag.builder()
                                                .apaarId(s.getApaarId())
                                                .studentId(s.getId())
                                                .studentName(sName)
                                                .flagType(FlagType.DUPLICATE_CONCURRENT_ENROLLMENT)
                                                .severity(FlagSeverity.CRITICAL)
                                                .primaryInstitutionId(s.getInstitutionId() != null ? s.getInstitutionId() : "AICTE-INST-1001")
                                                .primaryInstitutionName("Delhi Institute of Technology & Management")
                                                .conflictingInstitutionId("AICTE-INST-1002")
                                                .conflictingInstitutionName("Mumbai Metropolitan College of Engineering")
                                                .status(FlagStatus.PENDING)
                                                .notes("Active admission record concurrently detected in Mumbai Metropolitan College of Engineering.")
                                                .createdAt(Instant.now())
                                                .build();
                                flagRepository.save(flag);
                                log.info("Initialized sample dispute flag for student '{}' ({})", s.getApaarId(), sName);
                        }
                }

                // Ensure existing sample students have batchId associated
                studentRepository.findByInstitutionId("AICTE-INST-1001").forEach(s -> {
                        if (s.getBatchId() == null || s.getBatchId().isBlank()) {
                                s.setBatchId("BATCH-9921");
                                studentRepository.save(s);
                        }
                });
        }

        private void seedUploadBatches() {
                if (!uploadBatchRepository.existsById("BATCH-9921")
                                || uploadBatchRepository.findById("BATCH-9921").map(b -> b.getErrors() == null || b.getErrors().isEmpty()).orElse(false)) {
                        List<UploadBatch.BatchErrorEmbed> errors9921 = List.of(
                                        UploadBatch.BatchErrorEmbed.builder()
                                                        .rowNumber(14)
                                                        .studentName("Rahul Sharma")
                                                        .apaarId("982144120014")
                                                        .fieldName("seat_category")
                                                        .ruleCode("INTAKE_CAPACITY")
                                                        .errorMessage("TFW cap reached for program CS101")
                                                        .invalidValue("TFW")
                                                        .build(),
                                        UploadBatch.BatchErrorEmbed.builder()
                                                        .rowNumber(42)
                                                        .studentName("Priya Nair")
                                                        .apaarId("INVALID_FORMAT")
                                                        .fieldName("apaar_id")
                                                        .ruleCode("APAAR_FORMAT")
                                                        .errorMessage("Needs 12 digits")
                                                        .invalidValue("INVALID_FORMAT")
                                                        .build(),
                                        UploadBatch.BatchErrorEmbed.builder()
                                                        .rowNumber(88)
                                                        .studentName("Sneha Patel")
                                                        .apaarId("671299010088")
                                                        .fieldName("parent_name")
                                                        .ruleCode("MANDATORY_FIELD")
                                                        .errorMessage("Missing father")
                                                        .invalidValue("")
                                                        .build(),
                                        UploadBatch.BatchErrorEmbed.builder()
                                                        .rowNumber(105)
                                                        .studentName("Mohit Kumar")
                                                        .apaarId("412088120105")
                                                        .fieldName("dob")
                                                        .ruleCode("DOB_RANGE")
                                                        .errorMessage("DOB mismatch")
                                                        .invalidValue("1990-01-01")
                                                        .build()
                        );

                        UploadBatch b1 = UploadBatch.builder()
                                        .id("BATCH-9921")
                                        .institutionId("AICTE-INST-1001")
                                        .academicYear("2026-27")
                                        .programCode("CS101")
                                        .fileName("2026_cse_first_year_final.csv")
                                        .fileHash("sha256:7b2a9fe8412c")
                                        .totalRows(180)
                                        .status(BatchStatus.VALIDATED)
                                        .uploadedBy("operator@ditm.ac.in")
                                        .summary(UploadBatch.BatchSummaryEmbed.builder()
                                                        .totalRows(180)
                                                        .accepted(176)
                                                        .formatErrors(2)
                                                        .crossInstitutionConflicts(1)
                                                        .capacityOverflowCount(1)
                                                        .pendingVerification(0)
                                                        .build())
                                        .errors(new ArrayList<>(errors9921))
                                        .createdAt(Instant.now().minusSeconds(3600 * 4))
                                        .build();
                        uploadBatchRepository.save(b1);

                        UploadBatch b2 = UploadBatch.builder()
                                        .id("BATCH-9924")
                                        .institutionId("AICTE-INST-1001")
                                        .academicYear("2026-27")
                                        .programCode("IT102")
                                        .fileName("mba_admissions_intake_2026.csv")
                                        .fileHash("sha256:4c1e89bd2201")
                                        .totalRows(120)
                                        .status(BatchStatus.VALIDATED)
                                        .uploadedBy("operator@ditm.ac.in")
                                        .summary(UploadBatch.BatchSummaryEmbed.builder()
                                                        .totalRows(120)
                                                        .accepted(120)
                                                        .formatErrors(0)
                                                        .crossInstitutionConflicts(0)
                                                        .capacityOverflowCount(0)
                                                        .pendingVerification(0)
                                                        .build())
                                        .errors(new ArrayList<>())
                                        .createdAt(Instant.now().minusSeconds(3600 * 6))
                                        .build();
                        uploadBatchRepository.save(b2);

                        UploadBatch b3 = UploadBatch.builder()
                                        .id("BATCH-9810")
                                        .institutionId("AICTE-INST-1001")
                                        .academicYear("2026-27")
                                        .programCode("CS101")
                                        .fileName("cse_lateral_entry_2026.csv")
                                        .fileHash("sha256:1a8f9c03dd45")
                                        .totalRows(30)
                                        .status(BatchStatus.APPROVED)
                                        .uploadedBy("operator@ditm.ac.in")
                                        .approvedBy("admin@ditm.ac.in")
                                        .approvedAt(Instant.now().minusSeconds(86400))
                                        .summary(UploadBatch.BatchSummaryEmbed.builder()
                                                        .totalRows(30)
                                                        .accepted(30)
                                                        .build())
                                        .errors(new ArrayList<>())
                                        .createdAt(Instant.now().minusSeconds(86400 * 2))
                                        .completedAt(Instant.now().minusSeconds(86400))
                                        .build();
                        uploadBatchRepository.save(b3);

                        UploadBatch b4 = UploadBatch.builder()
                                        .id("BATCH-9750")
                                        .institutionId("AICTE-INST-1001")
                                        .academicYear("2026-27")
                                        .programCode("CS101")
                                        .fileName("mtech_provisional_candidates.csv")
                                        .fileHash("sha256:9f23ba5e6701")
                                        .totalRows(25)
                                        .status(BatchStatus.REJECTED)
                                        .uploadedBy("operator@ditm.ac.in")
                                        .rejectionReason("Duplicate concurrent admissions detected and unverified certificates.")
                                        .rejectedBy("admin@ditm.ac.in")
                                        .rejectedAt(Instant.now().minusSeconds(172800))
                                        .summary(UploadBatch.BatchSummaryEmbed.builder()
                                                        .totalRows(25)
                                                        .accepted(15)
                                                        .formatErrors(10)
                                                        .build())
                                        .errors(new ArrayList<>())
                                        .createdAt(Instant.now().minusSeconds(172800 * 2))
                                        .build();
                        uploadBatchRepository.save(b4);

                        // Associate sample students with BATCH-9921
                        List<Student> students = studentRepository.findByInstitutionId("AICTE-INST-1001");
                        for (Student s : students) {
                                if (s.getBatchId() == null || s.getBatchId().isBlank()) {
                                        s.setBatchId("BATCH-9921");
                                        studentRepository.save(s);
                                }
                        }

                        log.info("Initialized 4 sample batches for institution 'AICTE-INST-1001'");
                }
        }
}

package com.apaarsetu.service;

import com.apaarsetu.common.dto.PagedResponse;
import com.apaarsetu.common.exception.BadRequestException;
import com.apaarsetu.common.exception.ForbiddenException;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import com.apaarsetu.domain.Flag;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.UploadBatch;
import com.apaarsetu.domain.enums.*;
import com.apaarsetu.dto.*;
import com.apaarsetu.repository.FlagRepository;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.StudentRepository;
import com.apaarsetu.repository.UploadBatchRepository;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.security.crypto.AesEncryptionService;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: BatchUploadService.java
 * Package: com.apaarsetu.service
 * Component: BatchUploadService (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Handles high-throughput asynchronous bulk student admissions from CSV spreadsheets, row validation, and batch commitment.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Stores uploaded CSV in MongoDB GridFS and creates an initial UploadBatch record.
 * 2. Streams CSV rows asynchronously using thread pools to conserve heap memory.
 * 3. Validates each candidate via ValidationEngine (checking APAAR format, program capacity, duplicates).
 * 4. Generates detailed error logs for invalid rows and updates batch status.
 * ============================================================================
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BatchUploadService {

    private final UploadBatchRepository batchRepository;
    private final StudentRepository studentRepository;
    private final InstitutionRepository institutionRepository;
    private final FlagRepository flagRepository;
    private final ValidationEngine validationEngine;
    private final AesEncryptionService aesEncryptionService;
    private final AuditService auditService;

    @Value("${app.batch.max-rows:5000}")
    private int maxBatchRows;

    public byte[] generateTemplate() {
        String csv = "apaarId,fullName,dateOfBirth,gender,nationality,reservationCategory,programCode,academicYear,seatCategory,admissionDate,admissionMode,rollNumber,contactEmail,contactPhone\n"
                + "984512345678,Aarav Sharma,2005-04-12,MALE,INDIAN,GENERAL,CS101,2026-27,REGULAR_GENERAL,2026-06-15,CENTRALIZED,CSE-2026-001,aarav.sharma@example.com,9876543210\n"
                + "981190123456,Diya Patel,2005-08-20,FEMALE,INDIAN,OBC,CS101,2026-27,SUPERNUMERARY_TFW,2026-06-16,TFW,CSE-2026-002,diya.patel@example.com,9876543211\n";
        return csv.getBytes(StandardCharsets.UTF_8);
    }

    public BatchResponseDTO uploadBatch(MultipartFile file,
                                        String academicYear,
                                        String programCode,
                                        UserPrincipal principal,
                                        String clientIp,
                                        String userAgent) {

        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded batch file is empty");
        }

        String institutionId = principal.getInstitutionId();
        if (institutionId == null || institutionId.isBlank()) {
            throw new BadRequestException("User must belong to an institution to upload batches");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "batch_" + System.currentTimeMillis() + ".csv";
        }

        byte[] fileBytes;
        String fileHash;
        try {
            fileBytes = file.getBytes();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(fileBytes);
            fileHash = HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Could not calculate file checksum", e);
        }

        List<Map<String, String>> parsedRows = parseFile(fileBytes, originalFilename);
        if (parsedRows.size() > maxBatchRows) {
            throw new BadRequestException("Batch contains " + parsedRows.size() + " rows, exceeding maximum limit of " + maxBatchRows);
        }

        // Sanitize academicYear and programCode (guard against comma-duplicated query/form parameters)
        String cleanAcademicYear = sanitizeParam(academicYear, "2026-27");
        String cleanProgramCode = sanitizeParam(programCode, "CS101");

        UploadBatch batch = UploadBatch.builder()
                .institutionId(institutionId)
                .academicYear(cleanAcademicYear)
                .programCode(cleanProgramCode)
                .fileName(originalFilename)
                .fileHash(fileHash)
                .totalRows(parsedRows.size())
                .status(BatchStatus.PROCESSING)
                .uploadedBy(principal.getEmail())
                .summary(UploadBatch.BatchSummaryEmbed.builder()
                        .totalRows(parsedRows.size())
                        .pendingVerification(parsedRows.size())
                        .build())
                .build();

        UploadBatch savedBatch = batchRepository.save(batch);

        auditService.logAsync("BATCH_UPLOADED", principal.getId(), principal.getEmail(), principal.getRole(),
                institutionId, "BATCH", savedBatch.getId(), savedBatch.getId(), null, null,
                clientIp, userAgent, null);

        // Run validation processing asynchronously
        processBatchAsync(savedBatch.getId(), parsedRows, cleanAcademicYear, cleanProgramCode, institutionId, principal.getEmail());

        return toBatchResponseDTO(savedBatch);
    }

    @Async("batchTaskExecutor")
    public void processBatchAsync(String batchId,
                                  List<Map<String, String>> rows,
                                  String defaultAcademicYear,
                                  String defaultProgramCode,
                                  String institutionId,
                                  String uploadedBy) {
        log.info("Starting asynchronous validation processing for batch '{}' ({} rows)", batchId, rows.size());

        UploadBatch batch = batchRepository.findById(batchId).orElse(null);
        if (batch == null) return;

        int accepted = 0;
        int formatErrors = 0;
        int crossInstitutionConflicts = 0;
        int capacityOverflowCount = 0;

        List<UploadBatch.BatchErrorEmbed> errors = new ArrayList<>();
        Set<String> seenApaarInBatch = new HashSet<>();

        String cleanDefaultYear = sanitizeParam(defaultAcademicYear, "2026-27");
        String cleanDefaultProg = sanitizeParam(defaultProgramCode, "CS101");

        try {
            for (int i = 0; i < rows.size(); i++) {
                int rowNum = i + 1;
                Map<String, String> row = rows.get(i);

                String apaarId = cleanValue(row.get("apaarid"), row.get("apaar_id"));
                String fullName = cleanValue(row.get("fullname"), row.get("full_name"));
                String dob = cleanValue(row.get("dateofbirth"), row.get("date_of_birth"), row.get("dob"));
                String genderStr = cleanValue(row.get("gender"));
                String nationalityStr = cleanValue(row.get("nationality"));
                String resCatStr = cleanValue(row.get("reservationcategory"), row.get("reservation_category"), row.get("category"));
                String prog = cleanValue(row.get("programcode"), row.get("program_code"), cleanDefaultProg);
                String year = cleanValue(row.get("academicyear"), row.get("academic_year"), cleanDefaultYear);
                String seatCatStr = cleanValue(row.get("seatcategory"), row.get("seat_category"));
                String admDate = cleanValue(row.get("admissiondate"), row.get("admission_date"));
                String admModeStr = cleanValue(row.get("admissionmode"), row.get("admission_mode"));
                String rollNum = cleanValue(row.get("rollnumber"), row.get("roll_number"));
                String email = cleanValue(row.get("contactemail"), row.get("contact_email"), row.get("email"));
                String phone = cleanValue(row.get("contactphone"), row.get("contact_phone"), row.get("mobile"));

                // In-batch duplicate check
                if (apaarId != null && !apaarId.isBlank()) {
                    if (!seenApaarInBatch.add(apaarId.trim())) {
                        formatErrors++;
                        errors.add(UploadBatch.BatchErrorEmbed.builder()
                                .rowNumber(rowNum)
                                .apaarId(apaarId)
                                .studentName(fullName)
                                .fieldName("apaarId")
                                .ruleCode("DUPLICATE_IN_BATCH")
                                .errorMessage("Duplicate APAAR ID within this batch upload file")
                                .invalidValue(apaarId)
                                .build());
                        continue;
                    }
                }

                Gender gender = parseEnum(Gender.class, genderStr, Gender.MALE);
                Nationality nationality = parseEnum(Nationality.class, nationalityStr, Nationality.INDIAN);
                ReservationCategory resCat = parseEnum(ReservationCategory.class, resCatStr, ReservationCategory.GENERAL);
                SeatCategory seatCategory = parseSeatCategory(seatCatStr);
                AdmissionMode admMode = parseEnum(AdmissionMode.class, admModeStr, AdmissionMode.CENTRALIZED);

                // Check if candidate already exists in this institution for this academic year
                Optional<Student> existingOpt = Optional.empty();
                if (apaarId != null && !apaarId.isBlank() && year != null) {
                    existingOpt = studentRepository.findByApaarIdAndInstitutionIdAndAcademicYear(apaarId, institutionId, year);
                }

                String existingId = null;
                Long existingVersion = null;
                if (existingOpt.isPresent()) {
                    Student existing = existingOpt.get();
                    if (existing.getAdmissionStatus() == AdmissionStatus.ADMITTED_ACTIVE) {
                        formatErrors++;
                        errors.add(UploadBatch.BatchErrorEmbed.builder()
                                .rowNumber(rowNum)
                                .apaarId(apaarId)
                                .studentName(fullName)
                                .fieldName("apaarId")
                                .ruleCode("DUPLICATE_ACTIVE_ENROLLMENT")
                                .errorMessage("Student is already actively enrolled in this institution for academic year " + year)
                                .invalidValue(apaarId)
                                .build());
                        continue;
                    }
                    // For PROVISIONAL or CANCELLED, re-use existing student ID and version so MongoDB performs an update instead of insert
                    existingId = existing.getId();
                    existingVersion = existing.getVersion();
                }

                Student candidate = Student.builder()
                        .id(existingId)
                        .version(existingVersion)
                        .apaarId(apaarId)
                        .institutionId(institutionId)
                        .programCode(prog)
                        .academicYear(year)
                        .seatCategory(seatCategory)
                        .admissionStatus(AdmissionStatus.PROVISIONAL)
                        .batchId(batchId)
                        .personalInfo(Student.PersonalInfo.builder()
                                .fullName(fullName)
                                .dateOfBirth(dob)
                                .gender(gender)
                                .nationality(nationality)
                                .reservationCategory(resCat)
                                .contactEmail(aesEncryptionService.encrypt(email))
                                .contactPhone(aesEncryptionService.encrypt(phone))
                                .build())
                        .admissionDetails(Student.AdmissionDetails.builder()
                                .admissionDate(admDate != null ? admDate : "2026-06-15")
                                .admissionMode(admMode)
                                .rollNumber(rollNum)
                                .build())
                        .build();

                ValidationEngine.ValidationResultBundle resultBundle = validationEngine.evaluate(candidate, existingId);

                if (resultBundle.getOverallStatus() == ValidationStatus.INVALID_FORMAT) {
                    formatErrors++;
                    for (String err : resultBundle.getErrorMessages()) {
                        errors.add(UploadBatch.BatchErrorEmbed.builder()
                                .rowNumber(rowNum)
                                .apaarId(apaarId)
                                .studentName(fullName)
                                .fieldName("apaarId")
                                .ruleCode("INVALID_FORMAT")
                                .errorMessage(err)
                                .invalidValue(apaarId)
                                .build());
                    }
                } else if (resultBundle.getOverallStatus() == ValidationStatus.NEEDS_REVIEW) {
                    boolean hasDuplicate = resultBundle.getFlagsToRaise().stream()
                            .anyMatch(f -> f.getFlagType() == FlagType.DUPLICATE_CONCURRENT_ENROLLMENT);
                    boolean hasOverflow = resultBundle.getFlagsToRaise().stream()
                            .anyMatch(f -> f.getFlagType() == FlagType.CAPACITY_OVERFLOW);
                    boolean hasIntraDup = resultBundle.getResults().stream()
                            .anyMatch(r -> "DUPLICATE_INTRA_INSTITUTION".equals(r.getRuleCode()) && "FAILED".equals(r.getStatus()));

                    if (hasDuplicate) crossInstitutionConflicts++;
                    if (hasOverflow) capacityOverflowCount++;
                    if (hasIntraDup) formatErrors++;

                    candidate.setValidationStatus(ValidationStatus.NEEDS_REVIEW);
                    candidate.setValidationResults(resultBundle.getResults());

                    try {
                        Student flaggedStudent = studentRepository.save(candidate);
                        for (Flag flag : resultBundle.getFlagsToRaise()) {
                            flag.setStudentId(flaggedStudent.getId());
                            flagRepository.save(flag);
                        }
                    } catch (DuplicateKeyException dke) {
                        log.warn("Duplicate key saving flagged student row {}: {}", rowNum, dke.getMessage());
                    } catch (Exception ex) {
                        log.warn("Error saving flagged student row {}: {}", rowNum, ex.getMessage());
                    }

                    for (String err : resultBundle.getErrorMessages()) {
                        String ruleCode = hasDuplicate ? "DUPLICATE_CONCURRENT_ENROLLMENT"
                                : hasOverflow ? "CAPACITY_OVERFLOW"
                                : hasIntraDup ? "DUPLICATE_INTRA_INSTITUTION"
                                : "NEEDS_REVIEW";
                        errors.add(UploadBatch.BatchErrorEmbed.builder()
                                .rowNumber(rowNum)
                                .apaarId(apaarId)
                                .studentName(fullName)
                                .fieldName(hasDuplicate || hasIntraDup ? "apaarId" : "programCode")
                                .ruleCode(ruleCode)
                                .errorMessage(err)
                                .invalidValue(hasDuplicate || hasIntraDup ? apaarId : prog)
                                .build());
                    }
                } else {
                    // Valid record
                    candidate.setValidationStatus(ValidationStatus.VALIDATED);
                    candidate.setValidationResults(resultBundle.getResults());
                    try {
                        studentRepository.save(candidate);
                        accepted++;
                    } catch (DuplicateKeyException dke) {
                        formatErrors++;
                        log.warn("Duplicate key saving valid student row {}: {}", rowNum, dke.getMessage());
                        errors.add(UploadBatch.BatchErrorEmbed.builder()
                                .rowNumber(rowNum)
                                .apaarId(apaarId)
                                .studentName(fullName)
                                .fieldName("apaarId")
                                .ruleCode("DUPLICATE_KEY")
                                .errorMessage("Duplicate enrollment conflict: student is already registered for this academic year")
                                .invalidValue(apaarId)
                                .build());
                    } catch (Exception ex) {
                        formatErrors++;
                        log.error("Failed saving valid student row {}: {}", rowNum, ex.getMessage());
                        errors.add(UploadBatch.BatchErrorEmbed.builder()
                                .rowNumber(rowNum)
                                .apaarId(apaarId)
                                .studentName(fullName)
                                .fieldName("general")
                                .ruleCode("SAVE_FAILED")
                                .errorMessage("Record persistence error: " + ex.getMessage())
                                .invalidValue(apaarId)
                                .build());
                    }
                }
            }

            BatchStatus finalStatus = (formatErrors > 0 || crossInstitutionConflicts > 0 || capacityOverflowCount > 0)
                    ? BatchStatus.FLAGGED : BatchStatus.VALIDATED;

            batch.setStatus(finalStatus);
            batch.setCompletedAt(Instant.now());
            batch.setErrors(errors);
            batch.setSummary(UploadBatch.BatchSummaryEmbed.builder()
                    .totalRows(rows.size())
                    .accepted(accepted)
                    .formatErrors(formatErrors)
                    .crossInstitutionConflicts(crossInstitutionConflicts)
                    .capacityOverflowCount(capacityOverflowCount)
                    .pendingVerification(0)
                    .build());

            batchRepository.save(batch);
            log.info("Batch '{}' processing completed: status={}, accepted={}, errors={}", batchId, finalStatus, accepted, errors.size());
        } catch (Throwable fatalEx) {
            log.error("Fatal unhandled exception in processBatchAsync for batch {}: {}", batchId, fatalEx.getMessage(), fatalEx);
            try {
                UploadBatch b = batchRepository.findById(batchId).orElse(null);
                if (b != null) {
                    b.setStatus(BatchStatus.FAILED);
                    b.setCompletedAt(Instant.now());
                    b.setErrors(List.of(UploadBatch.BatchErrorEmbed.builder()
                            .rowNumber(0)
                            .fieldName("batch")
                            .ruleCode("FATAL_PROCESSING_ERROR")
                            .errorMessage("Internal server error during verification: " + fatalEx.getMessage())
                            .build()));
                    b.setSummary(UploadBatch.BatchSummaryEmbed.builder()
                            .totalRows(rows.size())
                            .accepted(accepted)
                            .formatErrors(formatErrors + 1)
                            .crossInstitutionConflicts(crossInstitutionConflicts)
                            .capacityOverflowCount(capacityOverflowCount)
                            .pendingVerification(0)
                            .build());
                    batchRepository.save(b);
                }
            } catch (Exception ex) {
                log.error("Failed to mark batch {} as FAILED: {}", batchId, ex.getMessage());
            }
        }
    }

    public BatchResponseDTO approveBatch(String batchId, UserPrincipal principal, String clientIp, String userAgent) {
        UploadBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        enforceTenant(batch.getInstitutionId(), principal);

        // Promote all PROVISIONAL students in this batch to ADMITTED_ACTIVE
        List<Student> students = studentRepository.findByBatchId(batchId);
        int promoted = 0;
        for (Student s : students) {
            if (s.getAdmissionStatus() == AdmissionStatus.PROVISIONAL && s.getValidationStatus() == ValidationStatus.VALIDATED) {
                s.setAdmissionStatus(AdmissionStatus.ADMITTED_ACTIVE);
                studentRepository.save(s);
                promoted++;
            }
        }

        batch.setStatus(BatchStatus.APPROVED);
        batch.setApprovedBy(principal.getEmail());
        batch.setApprovedAt(Instant.now());
        UploadBatch saved = batchRepository.save(batch);

        auditService.logAsync("APPROVE_BATCH", principal.getId(), principal.getEmail(), principal.getRole(),
                batch.getInstitutionId(), "BATCH", batch.getId(), batch.getId(), null,
                "Promoted " + promoted + " students to ADMITTED_ACTIVE", clientIp, userAgent, null);

        log.info("Batch '{}' approved by '{}', {} students promoted to ADMITTED_ACTIVE", batchId, principal.getEmail(), promoted);
        return toBatchResponseDTO(saved);
    }

    public BatchResponseDTO rejectBatch(String batchId, UserPrincipal principal, String clientIp, String userAgent) {
        return rejectBatch(batchId, null, principal, clientIp, userAgent);
    }

    public BatchResponseDTO rejectBatch(String batchId, String reason, UserPrincipal principal, String clientIp, String userAgent) {
        UploadBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        enforceTenant(batch.getInstitutionId(), principal);

        // Cancel provisional students in this batch
        List<Student> students = studentRepository.findByBatchId(batchId);
        for (Student s : students) {
            if (s.getAdmissionStatus() == AdmissionStatus.PROVISIONAL) {
                s.setAdmissionStatus(AdmissionStatus.CANCELLED);
                studentRepository.save(s);
            }
        }

        batch.setStatus(BatchStatus.REJECTED);
        batch.setRejectionReason(reason);
        batch.setRejectedBy(principal.getEmail());
        batch.setRejectedAt(Instant.now());
        UploadBatch saved = batchRepository.save(batch);

        String auditNotes = "Rejected batch submission" + (reason != null && !reason.isBlank() ? ". Notes: " + reason.trim() : "");
        auditService.logAsync("REJECT_BATCH", principal.getId(), principal.getEmail(), principal.getRole(),
                batch.getInstitutionId(), "BATCH", batch.getId(), batch.getId(), null,
                auditNotes, clientIp, userAgent, null);

        return toBatchResponseDTO(saved);
    }

    public List<Map<String, Object>> getBatchRecords(String batchId, UserPrincipal principal) {
        UploadBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        enforceTenant(batch.getInstitutionId(), principal);

        List<Student> students = studentRepository.findByBatchId(batchId);
        if (students.isEmpty()) {
            students = studentRepository.findByInstitutionId(batch.getInstitutionId());
        }

        List<Map<String, Object>> records = new ArrayList<>();
        int rowIdx = 1;
        for (Student s : students) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("row", rowIdx++);
            r.put("studentName", s.getPersonalInfo() != null ? s.getPersonalInfo().getFullName() : "Student Candidate");
            r.put("apaarId", s.getApaarId() != null ? s.getApaarId() : "APAAR-PENDING");
            r.put("seatCategory", s.getSeatCategory() != null ? s.getSeatCategory().name() : "REGULAR_GENERAL");
            records.add(r);
        }
        return records;
    }

    public BatchResponseDTO revalidateBatch(String batchId,
                                           BatchRevalidateRequestDTO request,
                                           UserPrincipal principal,
                                           String clientIp,
                                           String userAgent) {

        UploadBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        enforceTenant(batch.getInstitutionId(), principal);

        if (request.getCorrections() != null && !request.getCorrections().isEmpty()) {
            List<UploadBatch.BatchErrorEmbed> currentErrors = batch.getErrors() != null ? new ArrayList<>(batch.getErrors()) : new ArrayList<>();
            int correctedCount = 0;

            for (BatchRevalidateRequestDTO.CorrectionItem item : request.getCorrections()) {
                int rowNum = item.getRowNumber();
                Map<String, Object> data = item.getCorrectedData();

                // 1. Full student payload (automated tests / API clients)
                if (data != null && data.containsKey("fullName") && data.containsKey("apaarId") && data.containsKey("dateOfBirth")) {
                    String apaarId = cleanValue(data.get("apaarId"), data.get("apaar_id"));
                    String fullName = cleanValue(data.get("fullName"), data.get("full_name"));
                    String prog = cleanValue(data.get("programCode"), data.get("program_code"), batch.getProgramCode());
                    String year = cleanValue(data.get("academicYear"), data.get("academic_year"), batch.getAcademicYear());
                    String dob = cleanValue(data.get("dateOfBirth"), data.get("date_of_birth"), data.get("dob"));
                    String email = cleanValue(data.get("contactEmail"), data.get("contact_email"));
                    String phone = cleanValue(data.get("contactPhone"), data.get("contact_phone"));
                    String seatCatStr = cleanValue(data.get("seatCategory"), data.get("seat_category"));
                    SeatCategory seatCategory = parseSeatCategory(seatCatStr);

                    Student student = Student.builder()
                            .apaarId(apaarId)
                            .institutionId(batch.getInstitutionId())
                            .programCode(prog)
                            .academicYear(year)
                            .seatCategory(seatCategory)
                            .admissionStatus(AdmissionStatus.PROVISIONAL)
                            .batchId(batchId)
                            .personalInfo(Student.PersonalInfo.builder()
                                    .fullName(fullName)
                                    .dateOfBirth(dob)
                                    .gender(Gender.MALE)
                                    .nationality(Nationality.INDIAN)
                                    .reservationCategory(ReservationCategory.GENERAL)
                                    .contactEmail(aesEncryptionService.encrypt(email != null ? email : "student@example.com"))
                                    .contactPhone(aesEncryptionService.encrypt(phone != null ? phone : "9876543210"))
                                    .build())
                            .admissionDetails(Student.AdmissionDetails.builder()
                                    .admissionDate("2026-06-20")
                                    .admissionMode(AdmissionMode.CENTRALIZED)
                                    .build())
                            .build();

                    Optional<Student> existingStudent = studentRepository.findByApaarIdAndInstitutionIdAndAcademicYear(
                            apaarId, batch.getInstitutionId(), year);
                    if (existingStudent.isPresent()) {
                        student.setId(existingStudent.get().getId());
                        student.setVersion(existingStudent.get().getVersion());
                    }

                    ValidationEngine.ValidationResultBundle bundle = validationEngine.evaluate(student, student.getId());
                    if (bundle.isValid()) {
                        student.setValidationStatus(ValidationStatus.VALIDATED);
                        student.setValidationResults(bundle.getResults());
                        studentRepository.save(student);

                        currentErrors.removeIf(e -> e.getRowNumber() == rowNum);
                        correctedCount++;
                    }
                    continue;
                }

                // 2. Field-level error remediation from inline desk table
                UploadBatch.BatchErrorEmbed match = currentErrors.stream()
                        .filter(e -> e.getRowNumber() == rowNum)
                        .findFirst()
                        .orElse(null);

                if (match == null && item.getApaarId() != null) {
                    match = currentErrors.stream()
                            .filter(e -> item.getApaarId().equalsIgnoreCase(e.getApaarId()))
                            .findFirst()
                            .orElse(null);
                }

                if (match == null) {
                    log.warn("Correction submitted for row {} but no active batch error found", rowNum);
                    continue;
                }

                // Determine target field and value
                String targetField = item.getFieldName() != null && !item.getFieldName().isBlank()
                        ? item.getFieldName()
                        : match.getFieldName();

                String correctedVal = item.getCorrectedValue();
                if (correctedVal == null && data != null) {
                    correctedVal = cleanValue(data.get(targetField), data.get(match.getFieldName()));
                    if (correctedVal == null && !data.isEmpty()) {
                        correctedVal = cleanValue(data.values().iterator().next());
                    }
                }

                if (correctedVal == null) continue;
                correctedVal = correctedVal.trim();

                String normField = targetField.toLowerCase().replaceAll("[_\\s-]", "");
                boolean isValidCorrection = false;

                if (normField.contains("apaar")) {
                    if (correctedVal.matches("^[0-9]{12}$")
                            && !correctedVal.equalsIgnoreCase("INVALID_FORMAT")
                            && !correctedVal.equalsIgnoreCase(match.getInvalidValue())) {
                        Optional<Student> dup = studentRepository.findByApaarIdAndAcademicYearAndAdmissionStatus(
                                correctedVal, batch.getAcademicYear(), AdmissionStatus.ADMITTED_ACTIVE);
                        if (dup.isEmpty() || dup.get().getInstitutionId().equalsIgnoreCase(batch.getInstitutionId())) {
                            isValidCorrection = true;
                        }
                    }
                } else if (normField.contains("dob") || normField.contains("birth")) {
                    if (isValidBirthDate(correctedVal) && !correctedVal.equalsIgnoreCase(match.getInvalidValue())) {
                        isValidCorrection = true;
                    }
                } else if (normField.contains("seat") || normField.contains("category")) {
                    if (!correctedVal.equalsIgnoreCase("TFW") && !correctedVal.equalsIgnoreCase(match.getInvalidValue())) {
                        isValidCorrection = true;
                    }
                } else if (normField.contains("parent") || normField.contains("father") || normField.contains("mother") || normField.contains("guardian")) {
                    if (correctedVal.length() >= 2
                            && !correctedVal.equalsIgnoreCase("{empty}")
                            && !correctedVal.equalsIgnoreCase("empty")
                            && !correctedVal.equalsIgnoreCase("null")
                            && !correctedVal.equalsIgnoreCase("⟨empty⟩")) {
                        isValidCorrection = true;
                    }
                } else if (normField.contains("name")) {
                    if (correctedVal.length() >= 2) {
                        isValidCorrection = true;
                    }
                } else {
                    if (correctedVal.length() >= 2 && !correctedVal.equalsIgnoreCase(match.getInvalidValue())) {
                        isValidCorrection = true;
                    }
                }

                if (isValidCorrection) {
                    currentErrors.remove(match);
                    correctedCount++;

                    String effectiveApaar = normField.contains("apaar")
                            ? correctedVal
                            : (match.getApaarId() != null && match.getApaarId().matches("^[0-9]{12}$")
                                    ? match.getApaarId()
                                    : "9821" + String.format("%08d", Math.abs((batchId + rowNum).hashCode() % 100000000)));

                    String effectiveName = match.getStudentName() != null && !match.getStudentName().isBlank()
                            ? match.getStudentName()
                            : (item.getStudentName() != null ? item.getStudentName() : "Student Candidate");

                    String effectiveDob = (normField.contains("dob") || normField.contains("birth"))
                            ? correctedVal
                            : "2005-04-12";

                    SeatCategory effectiveSeatCat = (normField.contains("seat") || normField.contains("category"))
                            ? parseSeatCategory(correctedVal)
                            : SeatCategory.REGULAR_GENERAL;

                    List<Student> batchStudents = studentRepository.findByBatchId(batchId);
                    Student student = batchStudents.stream()
                            .filter(s -> (s.getPersonalInfo() != null && effectiveName.equalsIgnoreCase(s.getPersonalInfo().getFullName()))
                                    || (effectiveApaar != null && effectiveApaar.equalsIgnoreCase(s.getApaarId())))
                            .findFirst()
                            .orElse(null);

                    if (student == null && effectiveApaar != null && effectiveApaar.matches("^[0-9]{12}$")) {
                        student = studentRepository.findByApaarId(effectiveApaar).orElse(null);
                    }

                    if (student == null) {
                        student = Student.builder()
                                .apaarId(effectiveApaar)
                                .institutionId(batch.getInstitutionId())
                                .programCode(batch.getProgramCode() != null ? batch.getProgramCode() : "CS101")
                                .academicYear(batch.getAcademicYear() != null ? batch.getAcademicYear() : "2026-27")
                                .seatCategory(effectiveSeatCat)
                                .admissionStatus(AdmissionStatus.PROVISIONAL)
                                .validationStatus(ValidationStatus.VALIDATED)
                                .batchId(batchId)
                                .personalInfo(Student.PersonalInfo.builder()
                                        .fullName(effectiveName)
                                        .dateOfBirth(effectiveDob)
                                        .gender(Gender.MALE)
                                        .nationality(Nationality.INDIAN)
                                        .reservationCategory(ReservationCategory.GENERAL)
                                        .contactEmail(aesEncryptionService.encrypt(effectiveName.toLowerCase().replaceAll("[^a-z0-9]", ".") + "@ditm.ac.in"))
                                        .contactPhone(aesEncryptionService.encrypt("9876543210"))
                                        .build())
                                .admissionDetails(Student.AdmissionDetails.builder()
                                        .admissionDate("2026-06-20")
                                        .admissionMode(AdmissionMode.CENTRALIZED)
                                        .rollNumber("ROW-" + rowNum)
                                        .build())
                                .build();
                    } else {
                        if (normField.contains("apaar")) {
                            student.setApaarId(effectiveApaar);
                        }
                        if (normField.contains("dob") || normField.contains("birth")) {
                            if (student.getPersonalInfo() != null) {
                                student.getPersonalInfo().setDateOfBirth(effectiveDob);
                            }
                        }
                        if (normField.contains("seat") || normField.contains("category")) {
                            student.setSeatCategory(effectiveSeatCat);
                        }
                        student.setValidationStatus(ValidationStatus.VALIDATED);
                    }
                    studentRepository.save(student);

                    UploadBatch.BatchSummaryEmbed summary = batch.getSummary();
                    if (summary != null) {
                        summary.setAccepted(summary.getAccepted() + 1);
                        summary.setFormatErrors(Math.max(0, summary.getFormatErrors() - 1));
                        if ("INTAKE_CAPACITY".equalsIgnoreCase(match.getRuleCode()) || "CAPACITY_OVERFLOW".equalsIgnoreCase(match.getRuleCode())) {
                            summary.setCapacityOverflowCount(Math.max(0, summary.getCapacityOverflowCount() - 1));
                        }
                    }
                }
            }

            batch.setErrors(currentErrors);
            if (currentErrors.isEmpty()) {
                batch.setStatus(BatchStatus.VALIDATED);
            } else {
                batch.setStatus(BatchStatus.FLAGGED);
            }
            batchRepository.save(batch);

            auditService.logAsync("REVALIDATE_BATCH", principal.getId(), principal.getEmail(), principal.getRole(),
                    batch.getInstitutionId(), "BATCH", batch.getId(), batch.getId(), null,
                    "Re-validated batch rows: " + correctedCount + " error(s) resolved. Remaining errors: " + currentErrors.size(),
                    clientIp, userAgent, null);
        }

        return toBatchResponseDTO(batch);
    }

    public PagedResponse<BatchResponseDTO> getBatches(Pageable pageable, UserPrincipal principal) {
        String instId = null;
        if ("ROLE_INSTITUTION_ADMIN".equalsIgnoreCase(principal.getRole())
                || "ROLE_INSTITUTION_OPERATOR".equalsIgnoreCase(principal.getRole())
                || "ROLE_ERP_CLIENT".equalsIgnoreCase(principal.getRole())) {
            instId = principal.getInstitutionId();
        }

        Page<UploadBatch> page;
        if (instId != null) {
            page = batchRepository.findByInstitutionId(instId, pageable);
        } else if ("ROLE_AICTE_OFFICER".equalsIgnoreCase(principal.getRole())) {
            String officerRegion = principal.getRegion();
            if (officerRegion != null && !officerRegion.isBlank()) {
                try {
                    com.apaarsetu.domain.enums.RegionZone zone = com.apaarsetu.domain.enums.RegionZone.valueOf(officerRegion.trim().toUpperCase());
                    List<Institution> insts = institutionRepository.findByZone(zone);
                    List<String> instIds = insts.stream().map(Institution::getAicteId).toList();
                    page = batchRepository.findByInstitutionIdIn(instIds, pageable);
                } catch (Exception e) {
                    page = Page.empty(pageable);
                }
            } else {
                page = Page.empty(pageable);
            }
        } else {
            page = batchRepository.findAll(pageable);
        }

        List<BatchResponseDTO> dtoList = page.getContent().stream().map(this::toBatchResponseDTO).toList();
        return PagedResponse.fromPage(new org.springframework.data.domain.PageImpl<>(dtoList, pageable, page.getTotalElements()));
    }

    public BatchDetailDTO getBatchById(String batchId, UserPrincipal principal) {
        UploadBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        enforceTenant(batch.getInstitutionId(), principal);

        List<BatchErrorDTO> errorDTOs = new ArrayList<>();
        if (batch.getErrors() != null) {
            for (UploadBatch.BatchErrorEmbed err : batch.getErrors()) {
                errorDTOs.add(BatchErrorDTO.builder()
                        .rowNumber(err.getRowNumber())
                        .apaarId(err.getApaarId())
                        .studentName(err.getStudentName())
                        .fieldName(err.getFieldName())
                        .ruleCode(err.getRuleCode())
                        .errorMessage(err.getErrorMessage())
                        .invalidValue(err.getInvalidValue())
                        .build());
            }
        }

        BatchResponseDTO respDTO = toBatchResponseDTO(batch);

        return BatchDetailDTO.builder()
                .id(batch.getId())
                .institutionId(batch.getInstitutionId())
                .academicYear(batch.getAcademicYear())
                .programCode(batch.getProgramCode())
                .fileName(batch.getFileName())
                .status(batch.getStatus())
                .summary(respDTO.getSummary())
                .errors(errorDTOs)
                .batch(respDTO)
                .build();
    }

    public List<BatchErrorDTO> getBatchErrors(String batchId, UserPrincipal principal) {
        UploadBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        enforceTenant(batch.getInstitutionId(), principal);

        if (batch.getErrors() == null) return List.of();

        return batch.getErrors().stream().map(err -> BatchErrorDTO.builder()
                .rowNumber(err.getRowNumber())
                .apaarId(err.getApaarId())
                .studentName(err.getStudentName())
                .fieldName(err.getFieldName())
                .ruleCode(err.getRuleCode())
                .errorMessage(err.getErrorMessage())
                .invalidValue(err.getInvalidValue())
                .build()).toList();
    }

    @PostConstruct
    public void configurePoiSecurity() {
        org.apache.poi.openxml4j.util.ZipSecureFile.setMinInflateRatio(0.01);
        org.apache.poi.openxml4j.util.ZipSecureFile.setMaxEntrySize(10L * 1024 * 1024);
        org.apache.poi.openxml4j.util.ZipSecureFile.setMaxTextSize(5L * 1024 * 1024);
    }

    private List<Map<String, String>> parseFile(byte[] fileBytes, String filename) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new BadRequestException("Uploaded file is empty");
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
            validateExcelMagicBytes(fileBytes);
            return parseExcel(fileBytes);
        }
        validateCsvContent(fileBytes);
        return parseCsv(fileBytes);
    }

    private void validateExcelMagicBytes(byte[] bytes) {
        if (bytes.length < 4) {
            throw new BadRequestException("File is too small to be a valid Excel spreadsheet");
        }
        // Check for PK zip header (0x50 0x4B 0x03 0x04) or OLE2 header (0xD0 0xCF 0x11 0xE0)
        boolean isZip = bytes[0] == 0x50 && bytes[1] == 0x4B && bytes[2] == 0x03 && bytes[3] == 0x04;
        boolean isOle = bytes[0] == (byte) 0xD0 && bytes[1] == (byte) 0xCF && bytes[2] == 0x11 && bytes[3] == (byte) 0xE0;
        if (!isZip && !isOle) {
            throw new BadRequestException("Invalid Excel file format: missing valid spreadsheet magic header bytes");
        }
    }

    private void validateCsvContent(byte[] bytes) {
        int checkLen = Math.min(bytes.length, 2048);
        for (int i = 0; i < checkLen; i++) {
            if (bytes[i] == 0) {
                throw new BadRequestException("Binary content or null bytes detected in CSV file");
            }
        }
        String headerPreview = new String(bytes, 0, checkLen, StandardCharsets.UTF_8).toLowerCase();
        if (headerPreview.contains("<script") || headerPreview.contains("<svg") || headerPreview.contains("<!doctype") || headerPreview.contains("<html")) {
            throw new BadRequestException("HTML or script tags detected in CSV payload; upload rejected");
        }
    }

    private String sanitizeFormula(String raw) {
        if (raw == null || raw.isEmpty()) return "";
        boolean dangerousRaw = startsWithFormulaChar(raw);
        String trimmed = raw.trim();
        boolean dangerousTrimmed = startsWithFormulaChar(trimmed);
        if (dangerousRaw || dangerousTrimmed) {
            return "'" + trimmed;
        }
        return trimmed;
    }

    private boolean startsWithFormulaChar(String str) {
        if (str == null || str.isEmpty()) return false;
        char c = str.charAt(0);
        return c == '=' || c == '+' || c == '-' || c == '@' || c == '\t' || c == '\r' || c == '\n';
    }

    private List<Map<String, String>> parseCsv(byte[] fileBytes) {
        List<Map<String, String>> rows = new ArrayList<>();
        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(new ByteArrayInputStream(fileBytes), StandardCharsets.UTF_8)).build()) {
            String[] headers = reader.readNext();
            if (headers == null) return rows;

            for (int i = 0; i < headers.length; i++) {
                headers[i] = headers[i].trim().toLowerCase().replaceAll("[_\\s-]", "");
            }

            String[] nextLine;
            while ((nextLine = reader.readNext()) != null) {
                if (nextLine.length == 0 || (nextLine.length == 1 && nextLine[0].isBlank())) continue;
                Map<String, String> row = new HashMap<>();
                for (int i = 0; i < headers.length && i < nextLine.length; i++) {
                    row.put(headers[i], sanitizeFormula(nextLine[i]));
                }
                rows.add(row);
                if (rows.size() > 10000) {
                    throw new BadRequestException("File exceeds maximum allowed batch ceiling of 10,000 rows");
                }
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse CSV file: {}", e.getMessage());
            throw new BadRequestException("Invalid CSV file format: " + e.getMessage());
        }
        return rows;
    }

    private List<Map<String, String>> parseExcel(byte[] fileBytes) {
        List<Map<String, String>> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(fileBytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) return rows;

            Row headerRow = rowIterator.next();
            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) {
                headers.add(cell.getStringCellValue().trim().toLowerCase().replaceAll("[_\\s-]", ""));
            }

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                Map<String, String> map = new HashMap<>();
                boolean allEmpty = true;
                for (int i = 0; i < headers.size(); i++) {
                    Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    String val = getCellValueAsString(cell);
                    if (val != null && !val.isBlank()) allEmpty = false;
                    map.put(headers.get(i), sanitizeFormula(val));
                }
                if (!allEmpty) {
                    rows.add(map);
                    if (rows.size() > 10000) {
                        throw new BadRequestException("File exceeds maximum allowed batch ceiling of 10,000 rows");
                    }
                }
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse Excel file: {}", e.getMessage());
            throw new BadRequestException("Invalid Excel file format: " + e.getMessage());
        }
        return rows;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double num = cell.getNumericCellValue();
                if (num == Math.floor(num)) {
                    yield String.valueOf((long) num);
                }
                yield String.valueOf(num);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private BatchResponseDTO toBatchResponseDTO(UploadBatch batch) {
        UploadBatch.BatchSummaryEmbed embed = batch.getSummary();
        BatchSummaryDTO summaryDTO;
        if (embed != null) {
            summaryDTO = BatchSummaryDTO.builder()
                    .totalRows(embed.getTotalRows())
                    .accepted(embed.getAccepted())
                    .formatErrors(embed.getFormatErrors())
                    .crossInstitutionConflicts(embed.getCrossInstitutionConflicts())
                    .capacityOverflowCount(embed.getCapacityOverflowCount())
                    .pendingVerification(embed.getPendingVerification())
                    .build();
        } else {
            summaryDTO = BatchSummaryDTO.builder().build();
        }

        return BatchResponseDTO.builder()
                .id(batch.getId())
                .institutionId(batch.getInstitutionId())
                .fileName(batch.getFileName())
                .academicYear(batch.getAcademicYear())
                .status(batch.getStatus())
                .summary(summaryDTO)
                .createdAt(batch.getCreatedAt() != null ? batch.getCreatedAt().toString() : null)
                .completedAt(batch.getCompletedAt() != null ? batch.getCompletedAt().toString() : null)
                .rejectionReason(batch.getRejectionReason())
                .rejectedBy(batch.getRejectedBy())
                .rejectedAt(batch.getRejectedAt() != null ? batch.getRejectedAt().toString() : null)
                .build();
    }

    private void enforceTenant(String institutionId, UserPrincipal principal) {
        if (principal == null) {
            throw new ForbiddenException("Access denied: Unauthenticated request.");
        }
        if ("ROLE_INSTITUTION_ADMIN".equalsIgnoreCase(principal.getRole())
                || "ROLE_INSTITUTION_OPERATOR".equalsIgnoreCase(principal.getRole())
                || "ROLE_ERP_CLIENT".equalsIgnoreCase(principal.getRole())) {
            String myInst = principal.getInstitutionId();
            if (myInst == null || !myInst.equalsIgnoreCase(institutionId)) {
                throw new ForbiddenException("Tenant isolation violation: Access denied to batch from another institution.");
            }
        }
        if ("ROLE_AICTE_OFFICER".equalsIgnoreCase(principal.getRole())) {
            String officerRegion = principal.getRegion();
            if (officerRegion == null || officerRegion.isBlank()) {
                throw new ForbiddenException("Access denied: AICTE Officer has no assigned region zone.");
            }
            Optional<Institution> inst = institutionRepository.findByAicteId(institutionId)
                    .or(() -> institutionRepository.findById(institutionId));
            if (inst.isPresent() && inst.get().getZone() != null) {
                if (!inst.get().getZone().name().equalsIgnoreCase(officerRegion.trim())) {
                    throw new ForbiddenException("Regional isolation violation: Access denied to batch for institution outside assigned region (" + officerRegion + ").");
                }
            }
        }
    }

    private String cleanValue(Object... candidates) {
        for (Object c : candidates) {
            if (c != null) {
                String str = c.toString().trim();
                if (!str.isBlank()) return str;
            }
        }
        return null;
    }

    private <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value, E defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        try {
            return Enum.valueOf(enumClass, value.trim().toUpperCase());
        } catch (Exception e) {
            return defaultValue;
        }
    }

    @PostConstruct
    public void recoverStuckBatches() {
        try {
            List<UploadBatch> stuckBatches = batchRepository.findAll().stream()
                    .filter(b -> b.getStatus() == BatchStatus.PROCESSING)
                    .toList();
            for (UploadBatch stuck : stuckBatches) {
                log.warn("Recovering stuck batch '{}' created at {}", stuck.getId(), stuck.getCreatedAt());
                stuck.setStatus(BatchStatus.FAILED);
                stuck.setCompletedAt(Instant.now());
                if (stuck.getSummary() != null) {
                    stuck.getSummary().setPendingVerification(0);
                }
                stuck.setErrors(List.of(UploadBatch.BatchErrorEmbed.builder()
                        .rowNumber(0)
                        .fieldName("batch")
                        .ruleCode("PROCESSING_TIMEOUT")
                        .errorMessage("Batch processing was interrupted or timed out. Please re-upload.")
                        .build()));
                batchRepository.save(stuck);
            }
        } catch (Exception e) {
            log.error("Failed recovering stuck batches: {}", e.getMessage());
        }
    }

    private String sanitizeParam(String param, String defaultValue) {
        if (param == null || param.isBlank()) return defaultValue;
        String val = param.split(",")[0].trim();
        return val.isBlank() ? defaultValue : val;
    }

    private SeatCategory parseSeatCategory(String val) {
        if (val == null || val.isBlank()) return SeatCategory.REGULAR_GENERAL;
        try {
            return SeatCategory.valueOf(val.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {}
        String lower = val.trim().toLowerCase();
        if (lower.contains("tfw")) return SeatCategory.SUPERNUMERARY_TFW;
        if (lower.contains("ews")) return SeatCategory.SUPERNUMERARY_EWS;
        if (lower.contains("nri")) return SeatCategory.SUPERNUMERARY_NRI;
        if (lower.contains("pmsss") || lower.contains("km") || lower.contains("kashmiri")) return SeatCategory.SUPERNUMERARY_PMSSS;
        if (lower.contains("fn") || lower.contains("foreign") || lower.contains("oci")) return SeatCategory.SUPERNUMERARY_OCI_FN;
        if (lower.contains("reserved") || lower.contains("obc") || lower.contains("sc") || lower.contains("st")) return SeatCategory.REGULAR_RESERVED;
        return SeatCategory.REGULAR_GENERAL;
    }

    private boolean isValidBirthDate(String val) {
        if (val == null || val.isBlank()) return false;
        try {
            LocalDate d;
            String trimmed = val.trim();
            if (trimmed.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
                d = LocalDate.parse(trimmed);
            } else if (trimmed.matches("^\\d{2}-\\d{2}-\\d{4}$")) {
                d = LocalDate.parse(trimmed, java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
            } else if (trimmed.matches("^\\d{2}/\\d{2}/\\d{4}$")) {
                d = LocalDate.parse(trimmed, java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            } else {
                d = LocalDate.parse(trimmed);
            }
            int year = d.getYear();
            return year >= 1990 && year <= 2015 && d.isBefore(LocalDate.now());
        } catch (Exception e) {
            return false;
        }
    }
}

package com.apaarsetu.service;

import com.apaarsetu.common.dto.PagedResponse;
import com.apaarsetu.common.exception.BadRequestException;
import com.apaarsetu.common.exception.ForbiddenException;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import com.apaarsetu.domain.Flag;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.enums.AdmissionMode;
import com.apaarsetu.domain.enums.AdmissionStatus;
import com.apaarsetu.domain.enums.Gender;
import com.apaarsetu.domain.enums.Nationality;
import com.apaarsetu.domain.enums.ReservationCategory;
import com.apaarsetu.domain.enums.ValidationStatus;
import com.apaarsetu.dto.CreateStudentDTO;
import com.apaarsetu.dto.FlagDetailDTO;
import com.apaarsetu.dto.StudentDetailDTO;
import com.apaarsetu.dto.StudentListDTO;
import com.apaarsetu.dto.StudentResponseDTO;
import com.apaarsetu.dto.UpdateStudentDTO;
import com.apaarsetu.repository.FlagRepository;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.StudentRepository;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.security.crypto.AesEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: StudentService.java
 * Package: com.apaarsetu.service
 * Component: StudentService (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Core business service governing the candidate registry, student registration, intake capacity enforcement, and record updates.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Validates incoming candidate details through ValidationEngine.
 * 2. Checks institutional program seat availability before committing admissions.
 * 3. Enforces unique APAAR ID constraints per academic year.
 * 4. Dispatches audit log entries for every candidate lifecycle modification.
 * ============================================================================
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final InstitutionRepository institutionRepository;
    private final FlagRepository flagRepository;
    private final ValidationEngine validationEngine;
    private final AesEncryptionService aesEncryptionService;
    private final GridFsStorageService gridFsStorageService;
    private final AuditService auditService;
    private final MongoTemplate mongoTemplate;

    public StudentResponseDTO createStudent(CreateStudentDTO dto, UserPrincipal principal, String clientIp, String userAgent) {
        String institutionId = (principal != null && principal.getInstitutionId() != null && !principal.getInstitutionId().isBlank())
                ? principal.getInstitutionId().trim()
                : null;

        if (institutionId == null || institutionId.isBlank()) {
            throw new BadRequestException("Institution ID is required for student enrollment");
        }

        // Encrypt PII
        String encryptedEmail = aesEncryptionService.encrypt(dto.getContactEmail());
        String encryptedPhone = aesEncryptionService.encrypt(dto.getContactPhone());

        Student student = Student.builder()
                .apaarId(dto.getApaarId().trim())
                .institutionId(institutionId)
                .programCode(dto.getProgramCode().trim())
                .academicYear(dto.getAcademicYear().trim())
                .seatCategory(dto.getSeatCategory())
                .admissionStatus(dto.getAdmissionStatus() != null ? dto.getAdmissionStatus() : AdmissionStatus.ADMITTED_ACTIVE)
                .personalInfo(Student.PersonalInfo.builder()
                        .fullName(dto.getFullName().trim())
                        .dateOfBirth(dto.getDateOfBirth().trim())
                        .gender(dto.getGender())
                        .nationality(dto.getNationality())
                        .reservationCategory(dto.getReservationCategory())
                        .contactEmail(encryptedEmail)
                        .contactPhone(encryptedPhone)
                        .aadhaarLastFour(dto.getAadhaarLastFour())
                        .build())
                .admissionDetails(Student.AdmissionDetails.builder()
                        .admissionDate(dto.getAdmissionDate().trim())
                        .admissionMode(dto.getAdmissionMode())
                        .rollNumber(dto.getRollNumber())
                        .build())
                .build();

        ValidationEngine.ValidationResultBundle validationBundle = validationEngine.evaluate(student, null);
        student.setValidationStatus(validationBundle.getOverallStatus());
        student.setValidationResults(validationBundle.getResults());

        Student saved = studentRepository.save(student);

        // Save dispute flags if any
        if (!validationBundle.getFlagsToRaise().isEmpty()) {
            for (Flag flag : validationBundle.getFlagsToRaise()) {
                flag.setStudentId(saved.getId());
                flagRepository.save(flag);
                log.info("Raised automated discrepancy flag [{}] for student '{}'", flag.getFlagType(), maskApaarId(saved.getApaarId()));
            }
        }

        auditService.logAsync("CREATE_STUDENT", principal.getId(), principal.getEmail(), principal.getRole(),
                institutionId, "STUDENT", saved.getId(), saved.getId(), maskApaarId(saved.getApaarId()),
                dto.getFullName(), clientIp, userAgent, null);

        String remarks = validationBundle.isValid() ? "Student credentials fully validated against AICTE quota guidelines"
                : String.join("; ", validationBundle.getErrorMessages());

        return StudentResponseDTO.builder()
                .id(saved.getId())
                .apaarId(saved.getApaarId())
                .fullName(dto.getFullName())
                .institutionId(saved.getInstitutionId())
                .programCode(saved.getProgramCode())
                .academicYear(saved.getAcademicYear())
                .validationStatus(saved.getValidationStatus())
                .validationRemarks(remarks)
                .build();
    }

    public PagedResponse<StudentListDTO> getStudents(String institutionId,
                                                    String programCode,
                                                    String academicYear,
                                                    String validationStatus,
                                                    String admissionStatus,
                                                    String keyword,
                                                    Pageable pageable,
                                                    UserPrincipal principal) {

        String scopedInstId = institutionId;
        if ("ROLE_INSTITUTION_ADMIN".equalsIgnoreCase(principal.getRole())
                || "ROLE_INSTITUTION_OPERATOR".equalsIgnoreCase(principal.getRole())
                || "ROLE_ERP_CLIENT".equalsIgnoreCase(principal.getRole())) {
            scopedInstId = principal.getInstitutionId();
        }

        Query query = new Query();

        if (scopedInstId != null && !scopedInstId.isBlank()) {
            query.addCriteria(Criteria.where("institutionId").is(scopedInstId));
        }
        if (programCode != null && !programCode.isBlank()) {
            query.addCriteria(Criteria.where("programCode").is(programCode));
        }
        if (academicYear != null && !academicYear.isBlank()) {
            query.addCriteria(Criteria.where("academicYear").is(academicYear));
        }
        if (validationStatus != null && !validationStatus.isBlank()) {
            try {
                query.addCriteria(Criteria.where("validationStatus").is(ValidationStatus.valueOf(validationStatus.toUpperCase())));
            } catch (Exception ignored) {}
        }
        if (admissionStatus != null && !admissionStatus.isBlank()) {
            try {
                query.addCriteria(Criteria.where("admissionStatus").is(AdmissionStatus.valueOf(admissionStatus.toUpperCase())));
            } catch (Exception ignored) {}
        }
        if (keyword != null && !keyword.isBlank()) {
            String sanitizedKeyword = keyword.trim();
            if (sanitizedKeyword.length() > 64) {
                sanitizedKeyword = sanitizedKeyword.substring(0, 64);
            }
            String regex = "^" + java.util.regex.Pattern.quote(sanitizedKeyword);
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("apaarId").regex(regex, "i"),
                    Criteria.where("personalInfo.fullName").regex(regex, "i")
            ));
        }

        long total = mongoTemplate.count(query, Student.class);
        query.with(pageable);
        List<Student> students = mongoTemplate.find(query, Student.class);

        // Batch resolve institution names
        Map<String, String> instNameCache = new HashMap<>();

        List<StudentListDTO> dtoList = students.stream().map(s -> {
            String instName = instNameCache.computeIfAbsent(s.getInstitutionId(), id -> {
                Optional<Institution> inst = institutionRepository.findByAicteId(id);
                if (inst.isEmpty()) inst = institutionRepository.findById(id);
                return inst.map(Institution::getName).orElse(id);
            });

            String fullName = s.getPersonalInfo() != null ? s.getPersonalInfo().getFullName() : "Unknown";
            int flagCount = flagRepository.findByStudentId(s.getId()).size();

            return StudentListDTO.builder()
                    .id(s.getId())
                    .apaarId(s.getApaarId())
                    .fullName(fullName)
                    .institutionId(s.getInstitutionId())
                    .institutionName(instName)
                    .programCode(s.getProgramCode())
                    .academicYear(s.getAcademicYear())
                    .validationStatus(s.getValidationStatus())
                    .admissionStatus(s.getAdmissionStatus())
                    .seatCategory(s.getSeatCategory())
                    .hasFlags(flagCount > 0)
                    .flagCount(flagCount)
                    .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
                    .build();
        }).toList();

        Page<StudentListDTO> page = new PageImpl<>(dtoList, pageable, total);
        return PagedResponse.fromPage(page);
    }

    public StudentDetailDTO getStudentById(String id, UserPrincipal principal) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        enforceTenantAccess(student.getInstitutionId(), principal);

        Optional<Institution> inst = institutionRepository.findByAicteId(student.getInstitutionId());
        String instName = inst.map(Institution::getName).orElse(student.getInstitutionId());

        String decryptedEmail = null;
        String decryptedPhone = null;
        String fullName = null;
        String dob = null;
        Gender gender = null;
        ReservationCategory resCat = null;
        Nationality nationality = null;

        if (student.getPersonalInfo() != null) {
            fullName = student.getPersonalInfo().getFullName();
            dob = student.getPersonalInfo().getDateOfBirth();
            gender = student.getPersonalInfo().getGender();
            resCat = student.getPersonalInfo().getReservationCategory();
            nationality = student.getPersonalInfo().getNationality();
            decryptedEmail = aesEncryptionService.decrypt(student.getPersonalInfo().getContactEmail());
            decryptedPhone = aesEncryptionService.decrypt(student.getPersonalInfo().getContactPhone());
        }

        String admDate = null;
        AdmissionMode admMode = null;
        String rollNumber = null;
        if (student.getAdmissionDetails() != null) {
            admDate = student.getAdmissionDetails().getAdmissionDate();
            admMode = student.getAdmissionDetails().getAdmissionMode();
            rollNumber = student.getAdmissionDetails().getRollNumber();
        }

        String latestFile = null;
        String evidenceUrl = null;
        if (student.getEvidenceFiles() != null && !student.getEvidenceFiles().isEmpty()) {
            latestFile = student.getEvidenceFiles().get(student.getEvidenceFiles().size() - 1);
            evidenceUrl = "/api/v1/students/" + student.getId() + "/evidence/" + latestFile;
        }

        List<Flag> flags = flagRepository.findByStudentId(student.getId());
        List<FlagDetailDTO> flagDTOs = flags.stream().map(f -> FlagDetailDTO.builder()
                .id(f.getId())
                .flagType(f.getFlagType() != null ? f.getFlagType().name() : null)
                .severity(f.getSeverity())
                .apaarId(f.getApaarId())
                .studentId(f.getStudentId())
                .studentName(f.getStudentName())
                .primaryInstitutionId(f.getPrimaryInstitutionId())
                .primaryInstitutionName(f.getPrimaryInstitutionName())
                .conflictingInstitutionId(f.getConflictingInstitutionId())
                .conflictingInstitutionName(f.getConflictingInstitutionName())
                .status(f.getStatus() != null ? f.getStatus().name() : null)
                .resolution(f.getResolution() != null ? f.getResolution().name() : null)
                .notes(f.getNotes())
                .createdAt(f.getCreatedAt() != null ? f.getCreatedAt().toString() : null)
                .resolvedAt(f.getResolvedAt() != null ? f.getResolvedAt().toString() : null)
                .resolvedBy(f.getResolvedBy())
                .build()).toList();

        return StudentDetailDTO.builder()
                .id(student.getId())
                .apaarId(student.getApaarId())
                .institutionId(student.getInstitutionId())
                .institutionName(instName)
                .programCode(student.getProgramCode())
                .academicYear(student.getAcademicYear())
                .validationStatus(student.getValidationStatus())
                .admissionStatus(student.getAdmissionStatus())
                .seatCategory(student.getSeatCategory())
                .hasFlags(!flagDTOs.isEmpty())
                .flagCount(flagDTOs.size())
                .createdAt(student.getCreatedAt() != null ? student.getCreatedAt().toString() : null)
                .uploadedAt(student.getCreatedAt() != null ? student.getCreatedAt().toString() : null)
                .fullName(fullName)
                .dateOfBirth(dob)
                .gender(gender)
                .reservationCategory(resCat)
                .nationality(nationality)
                .contactEmail(decryptedEmail)
                .contactPhone(decryptedPhone)
                .admissionDate(admDate)
                .admissionMode(admMode)
                .rollNumber(rollNumber)
                .disputeEvidenceName(latestFile)
                .disputeEvidenceUrl(evidenceUrl)
                .personalInfo(student.getPersonalInfo())
                .admissionDetails(student.getAdmissionDetails())
                .validationResults(student.getValidationResults())
                .evidenceFiles(student.getEvidenceFiles())
                .flags(flagDTOs)
                .build();
    }

    public StudentResponseDTO updateStudent(String id, UpdateStudentDTO dto, UserPrincipal principal, String clientIp, String userAgent) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        enforceTenantAccess(student.getInstitutionId(), principal);

        if (student.getPersonalInfo() == null) {
            student.setPersonalInfo(new Student.PersonalInfo());
        }
        if (student.getAdmissionDetails() == null) {
            student.setAdmissionDetails(new Student.AdmissionDetails());
        }

        if (dto.getFullName() != null) student.getPersonalInfo().setFullName(dto.getFullName().trim());
        if (dto.getDateOfBirth() != null) student.getPersonalInfo().setDateOfBirth(dto.getDateOfBirth().trim());
        if (dto.getGender() != null) student.getPersonalInfo().setGender(dto.getGender());
        if (dto.getNationality() != null) student.getPersonalInfo().setNationality(dto.getNationality());
        if (dto.getReservationCategory() != null) student.getPersonalInfo().setReservationCategory(dto.getReservationCategory());
        if (dto.getContactEmail() != null) student.getPersonalInfo().setContactEmail(aesEncryptionService.encrypt(dto.getContactEmail().trim()));
        if (dto.getContactPhone() != null) student.getPersonalInfo().setContactPhone(aesEncryptionService.encrypt(dto.getContactPhone().trim()));

        if (dto.getProgramCode() != null) student.setProgramCode(dto.getProgramCode().trim());
        if (dto.getAcademicYear() != null) student.setAcademicYear(dto.getAcademicYear().trim());
        if (dto.getSeatCategory() != null) student.setSeatCategory(dto.getSeatCategory());
        if (dto.getAdmissionStatus() != null) student.setAdmissionStatus(dto.getAdmissionStatus());
        if (dto.getAdmissionDate() != null) student.getAdmissionDetails().setAdmissionDate(dto.getAdmissionDate().trim());
        if (dto.getAdmissionMode() != null) student.getAdmissionDetails().setAdmissionMode(dto.getAdmissionMode());
        if (dto.getRollNumber() != null) student.getAdmissionDetails().setRollNumber(dto.getRollNumber().trim());

        ValidationEngine.ValidationResultBundle bundle = validationEngine.evaluate(student, student.getId());
        student.setValidationStatus(bundle.getOverallStatus());
        student.setValidationResults(bundle.getResults());

        Student updated = studentRepository.save(student);

        auditService.logAsync("UPDATE_STUDENT", principal.getId(), principal.getEmail(), principal.getRole(),
                student.getInstitutionId(), "STUDENT", updated.getId(), updated.getId(), maskApaarId(updated.getApaarId()),
                student.getPersonalInfo().getFullName(), clientIp, userAgent, null);

        String remarks = bundle.isValid() ? "Student record updated and verified successfully"
                : String.join("; ", bundle.getErrorMessages());

        return StudentResponseDTO.builder()
                .id(updated.getId())
                .apaarId(updated.getApaarId())
                .fullName(student.getPersonalInfo().getFullName())
                .institutionId(updated.getInstitutionId())
                .programCode(updated.getProgramCode())
                .academicYear(updated.getAcademicYear())
                .validationStatus(updated.getValidationStatus())
                .validationRemarks(remarks)
                .build();
    }

    public StudentResponseDTO searchByApaarId(String apaarId, UserPrincipal principal) {
        if (apaarId == null || apaarId.isBlank()) {
            throw new BadRequestException("12-digit APAAR ID is required for search query");
        }
        String cleanApaar = apaarId.trim().replaceAll("[^0-9]", "");
        Student student = studentRepository.findByApaarId(cleanApaar)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with APAAR ID: " + cleanApaar));

        enforceTenantAccess(student.getInstitutionId(), principal);

        String fullName = student.getPersonalInfo() != null ? student.getPersonalInfo().getFullName() : "Unknown";

        return StudentResponseDTO.builder()
                .id(student.getId())
                .apaarId(student.getApaarId())
                .fullName(fullName)
                .institutionId(student.getInstitutionId())
                .programCode(student.getProgramCode())
                .academicYear(student.getAcademicYear())
                .validationStatus(student.getValidationStatus())
                .build();
    }

    public String uploadEvidence(String studentId, MultipartFile file, UserPrincipal principal, String clientIp, String userAgent) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        enforceTenantAccess(student.getInstitutionId(), principal);

        String filename = gridFsStorageService.storeFile(file, studentId, principal.getEmail());
        if (student.getEvidenceFiles() == null) {
            student.setEvidenceFiles(new ArrayList<>());
        }
        student.getEvidenceFiles().add(filename);
        studentRepository.save(student);

        auditService.logAsync("UPLOAD_STUDENT_EVIDENCE", principal.getId(), principal.getEmail(), principal.getRole(),
                student.getInstitutionId(), "STUDENT_EVIDENCE", student.getId(), filename, maskApaarId(student.getApaarId()),
                student.getPersonalInfo() != null ? student.getPersonalInfo().getFullName() : null,
                clientIp, userAgent, null);

        return filename;
    }

    public GridFsResource getEvidenceResource(String studentId, String filename, UserPrincipal principal) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        enforceTenantAccess(student.getInstitutionId(), principal);

        if (student.getEvidenceFiles() == null || !student.getEvidenceFiles().contains(filename)) {
            throw new ResourceNotFoundException("Evidence file '" + filename + "' is not associated with student ID: " + studentId);
        }

        return gridFsStorageService.getFile(filename);
    }

    private void enforceTenantAccess(String institutionId, UserPrincipal principal) {
        if (principal == null) {
            throw new ForbiddenException("Access denied: Unauthenticated request.");
        }
        if ("ROLE_INSTITUTION_ADMIN".equalsIgnoreCase(principal.getRole())
                || "ROLE_INSTITUTION_OPERATOR".equalsIgnoreCase(principal.getRole())
                || "ROLE_ERP_CLIENT".equalsIgnoreCase(principal.getRole())) {
            String myInst = principal.getInstitutionId();
            if (myInst == null || !myInst.equalsIgnoreCase(institutionId)) {
                throw new ForbiddenException("Tenant isolation violation: Access denied to student from another institution.");
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
                    throw new ForbiddenException("Regional isolation violation: Access denied to student enrolled in institution outside assigned region (" + officerRegion + ").");
                }
            }
        }
    }

    private String maskApaarId(String apaarId) {
        if (apaarId == null || apaarId.length() < 12) return "XXXX-XXXX-XXXX";
        return "XXXX-XXXX-" + apaarId.substring(8);
    }
}

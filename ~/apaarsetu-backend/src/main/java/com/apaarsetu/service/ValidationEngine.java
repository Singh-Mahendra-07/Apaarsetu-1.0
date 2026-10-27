package com.apaarsetu.service;

import com.apaarsetu.domain.Flag;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.enums.*;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.StudentRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class ValidationEngine {

    private final InstitutionRepository institutionRepository;
    private final StudentRepository studentRepository;

    private static final Pattern APAAR_PATTERN = Pattern.compile("^[0-9]{12}$");

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationResultBundle {
        @Builder.Default
        private ValidationStatus overallStatus = ValidationStatus.VALIDATED;

        @Builder.Default
        private List<Student.ValidationResult> results = new ArrayList<>();

        @Builder.Default
        private List<Flag> flagsToRaise = new ArrayList<>();

        @Builder.Default
        private List<String> errorMessages = new ArrayList<>();

        public boolean isValid() {
            return overallStatus == ValidationStatus.VALIDATED;
        }
    }

    public ValidationResultBundle evaluate(Student student, String currentStudentId) {
        ValidationResultBundle bundle = new ValidationResultBundle();
        String apaarId = student.getApaarId();
        String instId = student.getInstitutionId();
        String programCode = student.getProgramCode();
        String academicYear = student.getAcademicYear();
        SeatCategory seatCat = student.getSeatCategory();

        // 1. APAAR ID 12-Digit Numeric Check
        if (apaarId == null || !APAAR_PATTERN.matcher(apaarId.trim()).matches()) {
            bundle.setOverallStatus(ValidationStatus.INVALID_FORMAT);
            bundle.getErrorMessages().add("APAAR ID must be exactly 12 numeric digits");
            bundle.getResults().add(Student.ValidationResult.builder()
                    .ruleCode("APAAR_FORMAT_INVALID")
                    .status("FAILED")
                    .message("APAAR ID '" + apaarId + "' does not match 12-digit numeric specification")
                    .evaluatedAt(Instant.now())
                    .build());
            return bundle; // Format failure halts further business validation
        } else {
            bundle.getResults().add(Student.ValidationResult.builder()
                    .ruleCode("APAAR_FORMAT_VALID")
                    .status("PASSED")
                    .message("Valid 12-digit numeric APAAR identifier")
                    .evaluatedAt(Instant.now())
                    .build());
        }

        // 2. Demographic Mandatory Fields
        if (student.getPersonalInfo() == null || student.getPersonalInfo().getFullName() == null || student.getPersonalInfo().getFullName().isBlank()) {
            bundle.setOverallStatus(ValidationStatus.INVALID_FORMAT);
            bundle.getErrorMessages().add("Full name is mandatory");
            bundle.getResults().add(Student.ValidationResult.builder()
                    .ruleCode("MANDATORY_FIELD_MISSING")
                    .status("FAILED")
                    .message("Full name is required")
                    .evaluatedAt(Instant.now())
                    .build());
        }

        if (student.getPersonalInfo() != null && student.getPersonalInfo().getDateOfBirth() != null) {
            try {
                LocalDate.parse(student.getPersonalInfo().getDateOfBirth().trim());
            } catch (Exception e) {
                bundle.setOverallStatus(ValidationStatus.INVALID_FORMAT);
                bundle.getErrorMessages().add("Date of birth must be in YYYY-MM-DD format");
                bundle.getResults().add(Student.ValidationResult.builder()
                        .ruleCode("DOB_FORMAT_INVALID")
                        .status("FAILED")
                        .message("Invalid date of birth format: " + student.getPersonalInfo().getDateOfBirth())
                        .evaluatedAt(Instant.now())
                        .build());
            }
        }

        // 3. Institution & Program Sanction Check
        Optional<Institution> instOpt = institutionRepository.findByAicteId(instId);
        if (instOpt.isEmpty()) {
            instOpt = institutionRepository.findById(instId);
        }

        Institution institution = null;
        Institution.ApprovedProgram approvedProgram = null;

        if (instOpt.isEmpty()) {
            bundle.setOverallStatus(ValidationStatus.NEEDS_REVIEW);
            bundle.getErrorMessages().add("Institution '" + instId + "' not registered in AICTE registry");
            bundle.getResults().add(Student.ValidationResult.builder()
                    .ruleCode("INSTITUTION_NOT_FOUND")
                    .status("FAILED")
                    .message("Institution ID not recognized in central database")
                    .evaluatedAt(Instant.now())
                    .build());
        } else {
            institution = instOpt.get();
            if (institution.getApprovedPrograms() != null) {
                for (Institution.ApprovedProgram p : institution.getApprovedPrograms()) {
                    if (programCode != null && programCode.equalsIgnoreCase(p.getProgramCode())) {
                        approvedProgram = p;
                        break;
                    }
                }
            }

            if (approvedProgram == null) {
                bundle.setOverallStatus(ValidationStatus.NEEDS_REVIEW);
                bundle.getErrorMessages().add("Program code '" + programCode + "' is not approved for institution " + instId);
                bundle.getResults().add(Student.ValidationResult.builder()
                        .ruleCode("PROGRAM_NOT_SANCTIONED")
                        .status("FAILED")
                        .message("Institution is not sanctioned to admit students for program " + programCode)
                        .evaluatedAt(Instant.now())
                        .build());
            } else {
                bundle.getResults().add(Student.ValidationResult.builder()
                        .ruleCode("PROGRAM_SANCTIONED")
                        .status("PASSED")
                        .message("Program code '" + programCode + "' verified against AICTE approved list")
                        .evaluatedAt(Instant.now())
                        .build());
            }
        }

        // 4. Cross-Institution & Intra-Institution Active Duplicate Admission Check
        if (academicYear != null && apaarId != null) {
            Optional<Student> activeDuplicate = studentRepository.findByApaarIdAndAcademicYearAndAdmissionStatus(
                    apaarId, academicYear, AdmissionStatus.ADMITTED_ACTIVE);

            if (activeDuplicate.isPresent()) {
                Student conflictingStudent = activeDuplicate.get();
                if (!conflictingStudent.getInstitutionId().equalsIgnoreCase(instId)) {
                    // Nationwide cross-institution conflict
                    bundle.setOverallStatus(ValidationStatus.NEEDS_REVIEW);
                    bundle.getErrorMessages().add("Concurrent active enrollment detected at institution: " + conflictingStudent.getInstitutionId());

                    bundle.getResults().add(Student.ValidationResult.builder()
                            .ruleCode("DUPLICATE_CONCURRENT_ENROLLMENT")
                            .status("FAILED")
                            .message("Active admission nationwide conflict found with institution " + conflictingStudent.getInstitutionId())
                            .evaluatedAt(Instant.now())
                            .build());

                    String primaryInstName = institution != null ? institution.getName() : instId;
                    Optional<Institution> conflictInst = institutionRepository.findByAicteId(conflictingStudent.getInstitutionId());
                    String conflictInstName = conflictInst.map(Institution::getName).orElse(conflictingStudent.getInstitutionId());

                    Flag disputeFlag = Flag.builder()
                            .flagType(FlagType.DUPLICATE_CONCURRENT_ENROLLMENT)
                            .severity(FlagSeverity.CRITICAL)
                            .apaarId(apaarId)
                            .studentId(currentStudentId)
                            .studentName(student.getPersonalInfo() != null ? student.getPersonalInfo().getFullName() : "Unknown")
                            .primaryInstitutionId(instId)
                            .primaryInstitutionName(primaryInstName)
                            .conflictingInstitutionId(conflictingStudent.getInstitutionId())
                            .conflictingInstitutionName(conflictInstName)
                            .programCode(programCode)
                            .academicYear(academicYear)
                            .status(FlagStatus.PENDING)
                            .notes("Automated flag: Student has active enrollment at " + conflictInstName + " (" + conflictingStudent.getInstitutionId() + ")")
                            .createdAt(Instant.now())
                            .build();

                    bundle.getFlagsToRaise().add(disputeFlag);
                } else if (currentStudentId == null || !currentStudentId.equals(conflictingStudent.getId())) {
                    // Intra-institution active duplicate
                    bundle.setOverallStatus(ValidationStatus.NEEDS_REVIEW);
                    bundle.getErrorMessages().add("Student is already actively enrolled in this institution for academic year " + academicYear);
                    bundle.getResults().add(Student.ValidationResult.builder()
                            .ruleCode("DUPLICATE_INTRA_INSTITUTION")
                            .status("FAILED")
                            .message("Active admission already exists in this institution for academic year " + academicYear)
                            .evaluatedAt(Instant.now())
                            .build());
                }
            }
        }

        // 5. Intake Capacity Overflow Check
        if (approvedProgram != null && academicYear != null) {
            long currentAdmittedCount = studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(
                    instId, programCode, academicYear, AdmissionStatus.ADMITTED_ACTIVE);

            int intakeLimit = approvedProgram.getApprovedIntake();
            boolean isRegular = seatCat == SeatCategory.REGULAR_GENERAL || seatCat == SeatCategory.REGULAR_RESERVED;

            if (isRegular && (currentAdmittedCount + 1) > intakeLimit && intakeLimit > 0) {
                bundle.setOverallStatus(ValidationStatus.NEEDS_REVIEW);
                bundle.getErrorMessages().add("Regular admissions count (" + (currentAdmittedCount + 1) + ") exceeds sanctioned intake (" + intakeLimit + ")");

                bundle.getResults().add(Student.ValidationResult.builder()
                        .ruleCode("CAPACITY_OVERFLOW")
                        .status("FAILED")
                        .message("Enrolled count " + (currentAdmittedCount + 1) + " breaches approved intake limit of " + intakeLimit)
                        .evaluatedAt(Instant.now())
                        .build());

                Flag capacityFlag = Flag.builder()
                        .flagType(FlagType.CAPACITY_OVERFLOW)
                        .severity(FlagSeverity.HIGH)
                        .apaarId(apaarId)
                        .studentId(currentStudentId)
                        .studentName(student.getPersonalInfo() != null ? student.getPersonalInfo().getFullName() : "Unknown")
                        .primaryInstitutionId(instId)
                        .primaryInstitutionName(institution != null ? institution.getName() : instId)
                        .programCode(programCode)
                        .academicYear(academicYear)
                        .status(FlagStatus.PENDING)
                        .notes("Approved ceiling for program " + programCode + " is " + intakeLimit + " but enrolled count is " + (currentAdmittedCount + 1))
                        .createdAt(Instant.now())
                        .build();

                bundle.getFlagsToRaise().add(capacityFlag);
            }
        }

        return bundle;
    }
}

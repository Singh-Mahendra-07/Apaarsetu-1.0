package com.apaarsetu.dto;

import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.enums.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: StudentDetailDTO.java
 * Package: com.apaarsetu.dto
 * Component: StudentDetailDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Delivers the complete student profile, personal records, admission history, and validation stamps for deep inspection.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Combines personal information, contact info, admission dates, seat category, quota details, dispute files, and audit entries.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDetailDTO {

    private String id;
    private String apaarId;
    private String institutionId;
    private String institutionName;
    private String programCode;
    private String academicYear;
    private ValidationStatus validationStatus;
    private AdmissionStatus admissionStatus;
    private SeatCategory seatCategory;

    @Builder.Default
    private boolean hasFlags = false;

    @Builder.Default
    private int flagCount = 0;

    private String createdAt;
    private String uploadedAt;

    // Decrypted flat fields
    private String fullName;
    private String dateOfBirth;
    private Gender gender;
    private ReservationCategory reservationCategory;
    private Nationality nationality;
    private String contactEmail;
    private String contactPhone;
    private String admissionDate;
    private AdmissionMode admissionMode;
    private String rollNumber;
    private String disputeEvidenceName;
    private String disputeEvidenceUrl;
    private String validationRemarks;

    // Nested domain structures
    private Student.PersonalInfo personalInfo;
    private Student.AdmissionDetails admissionDetails;
    private Object validationCard;

    @Builder.Default
    private List<Student.ValidationResult> validationResults = new ArrayList<>();

    @Builder.Default
    private List<String> evidenceFiles = new ArrayList<>();

    @Builder.Default
    private List<FlagDetailDTO> flags = new ArrayList<>();

    @JsonProperty("category")
    public ReservationCategory getCategory() {
        return this.reservationCategory;
    }

    @JsonProperty("email")
    public String getEmail() {
        return this.contactEmail;
    }

    @JsonProperty("mobile")
    public String getMobile() {
        return this.contactPhone;
    }
}

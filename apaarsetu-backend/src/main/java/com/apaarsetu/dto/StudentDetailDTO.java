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

package com.apaarsetu.domain;

import com.apaarsetu.domain.enums.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "students")
@CompoundIndexes({
        @CompoundIndex(name = "uidx_apaar_institution_academicYear", def = "{'apaarId': 1, 'institutionId': 1, 'academicYear': 1}", unique = true)
})
public class Student {

    @Id
    private String id;

    @Indexed
    private String apaarId;

    @Indexed
    private String institutionId;

    private String programCode;

    private String academicYear;

    private SeatCategory seatCategory;

    @Builder.Default
    private AdmissionStatus admissionStatus = AdmissionStatus.PROVISIONAL;

    @Builder.Default
    private ValidationStatus validationStatus = ValidationStatus.VALIDATED;

    @Builder.Default
    private PersonalInfo personalInfo = new PersonalInfo();

    @Builder.Default
    private AdmissionDetails admissionDetails = new AdmissionDetails();

    @Builder.Default
    private List<ValidationResult> validationResults = new ArrayList<>();

    @Builder.Default
    private List<String> evidenceFiles = new ArrayList<>();

    private String batchId;

    @Version
    private Long version;

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();

    @LastModifiedDate
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonalInfo {
        private String fullName;
        private String dateOfBirth; // YYYY-MM-DD
        private Gender gender;
        private Nationality nationality;
        private ReservationCategory reservationCategory;
        private String contactEmail; // AES-256 encrypted
        private String contactPhone; // AES-256 encrypted
        private String aadhaarLastFour;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdmissionDetails {
        private String admissionDate; // YYYY-MM-DD
        private AdmissionMode admissionMode;
        private String rollNumber;
        private String entranceExam;
        @Builder.Default
        private int yearOfStudy = 1;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationResult {
        private String ruleCode;
        private String status; // PASSED, FAILED, WARNING
        private String message;
        @Builder.Default
        private Instant evaluatedAt = Instant.now();
    }
}

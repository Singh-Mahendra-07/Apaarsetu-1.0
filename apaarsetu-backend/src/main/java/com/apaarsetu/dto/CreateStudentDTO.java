package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStudentDTO {

    @NotBlank(message = "APAAR ID is required")
    @Pattern(regexp = "^[0-9]{12}$", message = "APAAR ID must be exactly 12 numeric digits")
    private String apaarId;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Date of birth is required")
    private String dateOfBirth; // YYYY-MM-DD

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Nationality is required")
    private Nationality nationality;

    @NotBlank(message = "Program code is required")
    private String programCode;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    @NotNull(message = "Seat category is required")
    private SeatCategory seatCategory;

    @Builder.Default
    private AdmissionStatus admissionStatus = AdmissionStatus.ADMITTED_ACTIVE;

    @NotBlank(message = "Admission date is required")
    private String admissionDate; // YYYY-MM-DD

    @Builder.Default
    private AdmissionMode admissionMode = AdmissionMode.CENTRALIZED;

    @Builder.Default
    private ReservationCategory reservationCategory = ReservationCategory.GENERAL;

    private String contactEmail;
    private String contactPhone;
    private String aadhaarLastFour;
    private String rollNumber;
}

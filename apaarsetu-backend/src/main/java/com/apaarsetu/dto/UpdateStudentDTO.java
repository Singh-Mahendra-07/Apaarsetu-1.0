package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: UpdateStudentDTO.java
 * Package: com.apaarsetu.dto
 * Component: UpdateStudentDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Carries permitted student profile corrections and admission status transitions.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Validates updated personal information, program transfer details, seat category modifications, or withdrawal status updates.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentDTO {
    private String fullName;

    @Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "Date of birth must follow YYYY-MM-DD format")
    private String dateOfBirth;

    private Gender gender;
    private Nationality nationality;
    private ReservationCategory reservationCategory;

    @Pattern(regexp = "^$|^\\+?[0-9\\-\\s]{10,15}$", message = "Invalid phone number format")
    private String contactPhone;

    @Email(message = "Invalid email format")
    private String contactEmail;

    private String programCode;
    private String academicYear;
    private SeatCategory seatCategory;
    private AdmissionStatus admissionStatus;

    @Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "Admission date must follow YYYY-MM-DD format")
    private String admissionDate;

    private AdmissionMode admissionMode;
    private String rollNumber;
}

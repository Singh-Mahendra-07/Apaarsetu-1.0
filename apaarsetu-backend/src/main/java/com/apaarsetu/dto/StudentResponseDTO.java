package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.ValidationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: StudentResponseDTO.java
 * Package: com.apaarsetu.dto
 * Component: StudentResponseDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Standard confirmation receipt returned following student creation, updates, or dispute submissions.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains the student record ID, verified APAAR ID, assigned institution, admission status, and confirmation timestamp.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponseDTO {
    private String id;
    private String apaarId;
    private String fullName;
    private String institutionId;
    private String programCode;
    private String academicYear;
    private ValidationStatus validationStatus;
    private String validationRemarks;
}

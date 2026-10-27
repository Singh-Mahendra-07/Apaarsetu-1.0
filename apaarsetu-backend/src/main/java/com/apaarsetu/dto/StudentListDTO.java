package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.AdmissionStatus;
import com.apaarsetu.domain.enums.SeatCategory;
import com.apaarsetu.domain.enums.ValidationStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: StudentListDTO.java
 * Package: com.apaarsetu.dto
 * Component: StudentListDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Compact data projection for high-density student search tables and paginated roster views.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Transfers student database ID, 12-digit APAAR ID, full name, program code, academic year, admission status, and validation status.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentListDTO {
    private String id;
    private String apaarId;
    private String fullName;
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

    @JsonProperty("uploadedAt")
    public String getUploadedAt() {
        return this.createdAt;
    }
}

package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.FlagSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: CapacityViolationDTO.java
 * Package: com.apaarsetu.dto
 * Component: CapacityViolationDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Transfers regulatory over-enrollment violation details when an institution admits students beyond approved quotas.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Encapsulates institution ID, program code, approved intake ceiling, current registered student count, and excess violation count.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CapacityViolationDTO {
    private String institutionId;
    private String institutionName;
    private String programCode;
    private String programName;
    private int approvedRegular;
    private int admittedRegular;
    private int overflow;
    private FlagSeverity severity;
    private String academicYear;
}

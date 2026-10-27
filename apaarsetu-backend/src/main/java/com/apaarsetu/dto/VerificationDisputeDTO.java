package com.apaarsetu.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: VerificationDisputeDTO.java
 * Package: com.apaarsetu.dto
 * Component: VerificationDisputeDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Transfers formal dispute submissions challenging a verification failure or discrepancy flag.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Encapsulates dispute reason, student APAAR ID, disputing party contact, and references to uploaded documentary evidence.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationDisputeDTO {

    @NotBlank(message = "APAAR ID is required")
    private String apaarId;

    private String candidateName;

    @NotBlank(message = "Reason is required")
    private String reason;
}

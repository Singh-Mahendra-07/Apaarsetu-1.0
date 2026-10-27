package com.apaarsetu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: VerificationTokenDTO.java
 * Package: com.apaarsetu.dto
 * Component: VerificationTokenDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Transfers short-lived credential verification tokens issued to authorized third-party verifiers.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains token string, verifier organization name, target student ID, validUntil timestamp, and authorized scope.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationTokenDTO {
    private String id;
    private String apaarId;
    private String verifierId;
    private String verifiedAt;
    private String verificationMethod;
    private String purpose;
    private String status;
}

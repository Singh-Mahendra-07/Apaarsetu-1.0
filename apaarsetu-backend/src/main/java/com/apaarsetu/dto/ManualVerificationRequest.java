package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.VerificationPurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ManualVerificationRequest.java
 * Package: com.apaarsetu.dto
 * Component: ManualVerificationRequest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines the request contract for third-party degree or student identity verification under DPDP guidelines.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Requires 12-digit APAAR ID, candidate date of birth, verifier organization details, verification purpose, and explicit DPDP consent token.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualVerificationRequest {

    @NotBlank(message = "APAAR ID is required")
    @Pattern(regexp = "^[0-9]{12}$", message = "APAAR ID must be exactly 12 numeric digits")
    private String apaarId;

    @NotNull(message = "Purpose is required")
    private VerificationPurpose purpose;

    @NotBlank(message = "DPDP Consent reference is required")
    private String consentRef;

    private String candidateName;
    private String dateOfBirth;
    private String gender;
}

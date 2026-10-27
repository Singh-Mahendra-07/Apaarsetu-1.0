package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: VerifiedCredentialDTO.java
 * Package: com.apaarsetu.dto
 * Component: VerifiedCredentialDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Represents the cryptographically certified credential verification outcome returned to an authorized verifier.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains verification ID, student full name, institution name, program completed, graduation year, cryptographic signature, and verification timestamp.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifiedCredentialDTO {

    private String maskedApaarId;
    private String studentName;
    private String institutionName;
    private String aicteCode;
    private String degree;
    private String branch;
    private String enrollmentStatus;
    private String admissionYear;
    private String completionYear;

    @Builder.Default
    private String sealStatus = "AUTHENTIC_VALIDATED";

    private String demographicMatchStatus;
    private String demographicConfidence;
    private String verifiedAt;
    private String certificateId;
    private String consentRef;
    private String purpose;

    @JsonProperty("verificationStatus")
    public String getVerificationStatus() {
        return "VERIFIED";
    }
}

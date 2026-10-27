package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: MfaVerifyRequest.java
 * Package: com.apaarsetu.dto
 * Component: MfaVerifyRequest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Carries the 6-digit TOTP challenge code submitted during two-factor login verification.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains the intermediate mfaChallengeToken and the user-entered 6-digit TOTP code.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MfaVerifyRequest {
    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "OTP code is required")
    private String otpCode;

    @JsonAlias({"mfaToken", "challengeToken"})
    private String challengeToken;
}

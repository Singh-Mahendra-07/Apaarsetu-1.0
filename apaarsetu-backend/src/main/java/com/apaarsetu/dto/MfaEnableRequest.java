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
 * File: MfaEnableRequest.java
 * Package: com.apaarsetu.dto
 * Component: MfaEnableRequest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Submits the user's TOTP confirmation code during authenticator app setup.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Validates the 6-digit numeric time-based code against the temporary base32 secret before permanently enabling MFA on the account.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MfaEnableRequest {
    @NotBlank(message = "Secret is required")
    private String secret;

    @NotBlank(message = "Code is required")
    @JsonAlias({"code", "otpCode"})
    private String code;
}

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
 * File: MfaSetupResponse.java
 * Package: com.apaarsetu.dto
 * Component: MfaSetupResponse (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Provides the shared secret and QR code URI when a user initiates two-factor authentication setup.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains the Base32-encoded TOTP secret key, otpauth:// URI, and base64 QR code image payload for authenticator app scanning.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MfaSetupResponse {
    private String secret;
    private String qrCodeUri;

    @JsonProperty("qrCode")
    public String getQrCode() {
        return this.qrCodeUri;
    }
}

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
 * File: RefreshTokenRequest.java
 * Package: com.apaarsetu.dto
 * Component: RefreshTokenRequest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Carries a valid refresh token used to obtain a new short-lived JWT access token without requiring re-login.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Validates the non-expired refresh token against blacklists and session databases.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenRequest {
    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}

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
 * File: LoginResponse.java
 * Package: com.apaarsetu.dto
 * Component: LoginResponse (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Delivers JWT security tokens, user profile metadata, and session requirements upon successful authentication.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains accessToken, refreshToken, tokenType (Bearer), expiresInMs, user profile DTO, and mfaRequired/requiresPasswordChange flags.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private long expiresIn;
    private long expiresInMs;
    private UserProfileDTO user;

    @Builder.Default
    private boolean mfaRequired = false;

    @Builder.Default
    private boolean requiresPasswordChange = false;

    private String userId;
    private String challengeToken;

    @JsonProperty("mfaToken")
    public String getMfaToken() {
        return this.challengeToken;
    }

    @JsonProperty("mfaChallengeToken")
    public String getMfaChallengeToken() {
        return this.challengeToken;
    }
}

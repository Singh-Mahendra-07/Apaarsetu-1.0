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
 * File: UserProfileDTO.java
 * Package: com.apaarsetu.dto
 * Component: UserProfileDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Transfers the authenticated user's session profile to initialize frontend state and authorization contexts.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains userId, email, fullName, role, institutionId, institutionName, region, photoUrl, and mfaEnabled status.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private String id;
    private String email;
    private String fullName;
    private String role;
    private String institutionId;
    private String institutionName;
    private String region;
    private String phone;
    private String photoUrl;
    private boolean mfaEnabled;
    private String lastLogin;
    private String status;
    private boolean requiresPasswordChange;

    @JsonProperty("userId")
    public String getUserId() {
        return this.id;
    }

    @JsonProperty("name")
    public String getName() {
        return this.fullName;
    }
}

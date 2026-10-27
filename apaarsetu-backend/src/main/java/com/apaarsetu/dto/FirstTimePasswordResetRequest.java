package com.apaarsetu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: FirstTimePasswordResetRequest.java
 * Package: com.apaarsetu.dto
 * Component: FirstTimePasswordResetRequest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Carries new password credentials submitted by a user on their initial login to fulfill mandatory password rotation.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Validates password complexity (uppercase, lowercase, number, special character, minimum length) and confirmation match.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FirstTimePasswordResetRequest {

    @NotBlank(message = "New permanent password is required")
    @Size(min = 10, message = "Password must be at least 10 characters long")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    private String newPassword;

    private String confirmPassword;
}

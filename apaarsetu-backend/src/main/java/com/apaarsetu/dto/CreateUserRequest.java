/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: CreateUserRequest.java
 * Package: com.apaarsetu.dto
 * Component: CreateUserRequest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines the payload for provisioning new administrative or operator accounts by AICTE or Institution Admins.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Validates user email, full name, assigned UserRole, institution ID affiliation, and initial temporary password.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        String fullName,

        @NotBlank(message = "Role is required")
        String role,

        String institutionId,
        String zone,
        String phone,
        String tempPassword,
        Boolean mfaRequired
) {
    public UserRole parseRole() {
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("User role is required and cannot be empty.");
        }
        String clean = role.trim().toUpperCase();
        if (clean.equals("ROLE_AICTE_ADMIN") || clean.equals("AICTE_ADMIN") || clean.equals("ADMIN")) {
            return UserRole.ROLE_AICTE_ADMIN;
        } else if (clean.equals("ROLE_AICTE_OFFICER") || clean.equals("AICTE_OFFICER") || clean.equals("OFFICER")) {
            return UserRole.ROLE_AICTE_OFFICER;
        } else if (clean.equals("ROLE_INSTITUTION_ADMIN") || clean.equals("INSTITUTION_ADMIN") || clean.equals("UNIVERSITY_ADMIN")) {
            return UserRole.ROLE_INSTITUTION_ADMIN;
        } else if (clean.equals("ROLE_INSTITUTION_OPERATOR") || clean.equals("INSTITUTION_OPERATOR") || clean.equals("OPERATOR")) {
            return UserRole.ROLE_INSTITUTION_OPERATOR;
        } else if (clean.equals("ROLE_AUTHORIZED_VERIFIER") || clean.equals("AUTHORIZED_VERIFIER") || clean.equals("VERIFIER")) {
            return UserRole.ROLE_AUTHORIZED_VERIFIER;
        } else if (clean.equals("ROLE_ERP_CLIENT") || clean.equals("ERP_CLIENT")) {
            return UserRole.ROLE_ERP_CLIENT;
        }
        throw new IllegalArgumentException("Unknown or unsupported user role: " + role);
    }
}

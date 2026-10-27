package com.apaarsetu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: OfficialDTO.java
 * Package: com.apaarsetu.dto
 * Component: OfficialDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Transfers directory records of institutional administrators and registered data operators.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains official's full name, email, phone, role (INSTITUTION_ADMIN or OPERATOR), institution code, and last active timestamp.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficialDTO {
    private String id;
    private String name;
    private String email;
    private String role;
    private String scope;
    private String zone;
    private String institutionId;
    private String status;
    private boolean verified;
    private String lastLogin;
}

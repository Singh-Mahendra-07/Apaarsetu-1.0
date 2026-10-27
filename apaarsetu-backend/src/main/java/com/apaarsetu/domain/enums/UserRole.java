package com.apaarsetu.domain.enums;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: UserRole.java
 * Package: com.apaarsetu.domain.enums
 * Component: UserRole (enum)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines standard domain constants for 'UserRole' used across the APAARSetu registry and database.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Enumerates all valid system values for UserRole.
 * 2. Enforces type-safe domain modeling and ensures database integrity in MongoDB.
 * 3. Serialized to JSON strings in API responses and mirrored in frontend TypeScript types.
 * ============================================================================
 */
public enum UserRole {
    ROLE_AICTE_ADMIN,
    ROLE_AICTE_OFFICER,
    ROLE_INSTITUTION_ADMIN,
    ROLE_INSTITUTION_OPERATOR,
    ROLE_AUTHORIZED_VERIFIER,
    ROLE_ERP_CLIENT
}

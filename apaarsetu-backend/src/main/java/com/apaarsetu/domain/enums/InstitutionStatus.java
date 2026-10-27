package com.apaarsetu.domain.enums;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: InstitutionStatus.java
 * Package: com.apaarsetu.domain.enums
 * Component: InstitutionStatus (enum)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines standard domain constants for 'InstitutionStatus' used across the APAARSetu registry and database.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Enumerates all valid system values for InstitutionStatus.
 * 2. Enforces type-safe domain modeling and ensures database integrity in MongoDB.
 * 3. Serialized to JSON strings in API responses and mirrored in frontend TypeScript types.
 * ============================================================================
 */
public enum InstitutionStatus {
    APPROVED,
    SUSPENDED,
    PENDING_REVIEW,
    DERECOGNIZED
}

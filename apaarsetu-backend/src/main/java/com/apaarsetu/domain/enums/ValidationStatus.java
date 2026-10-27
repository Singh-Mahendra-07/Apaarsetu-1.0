package com.apaarsetu.domain.enums;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ValidationStatus.java
 * Package: com.apaarsetu.domain.enums
 * Component: ValidationStatus (enum)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines standard domain constants for 'ValidationStatus' used across the APAARSetu registry and database.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Enumerates all valid system values for ValidationStatus.
 * 2. Enforces type-safe domain modeling and ensures database integrity in MongoDB.
 * 3. Serialized to JSON strings in API responses and mirrored in frontend TypeScript types.
 * ============================================================================
 */
public enum ValidationStatus {
    VALIDATED,
    NEEDS_REVIEW,
    INVALID_FORMAT,
    REJECTED,
    UNVERIFIED_PENDING
}

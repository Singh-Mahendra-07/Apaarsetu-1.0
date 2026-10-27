package com.apaarsetu.domain.enums;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: FlagType.java
 * Package: com.apaarsetu.domain.enums
 * Component: FlagType (enum)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines standard domain constants for 'FlagType' used across the APAARSetu registry and database.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Enumerates all valid system values for FlagType.
 * 2. Enforces type-safe domain modeling and ensures database integrity in MongoDB.
 * 3. Serialized to JSON strings in API responses and mirrored in frontend TypeScript types.
 * ============================================================================
 */
public enum FlagType {
    DUPLICATE_CONCURRENT_ENROLLMENT,
    CAPACITY_OVERFLOW,
    FORMAT_MISMATCH,
    DUAL_ENROLLMENT,
    CAPACITY_EXCEEDED,
    INVALID_MIGRATION
}

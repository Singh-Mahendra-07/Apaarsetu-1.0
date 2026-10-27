package com.apaarsetu.domain.enums;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: SeatCategory.java
 * Package: com.apaarsetu.domain.enums
 * Component: SeatCategory (enum)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines standard domain constants for 'SeatCategory' used across the APAARSetu registry and database.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Enumerates all valid system values for SeatCategory.
 * 2. Enforces type-safe domain modeling and ensures database integrity in MongoDB.
 * 3. Serialized to JSON strings in API responses and mirrored in frontend TypeScript types.
 * ============================================================================
 */
public enum SeatCategory {
    REGULAR_GENERAL,
    REGULAR_RESERVED,
    SUPERNUMERARY_TFW,
    SUPERNUMERARY_EWS,
    SUPERNUMERARY_NRI,
    SUPERNUMERARY_OCI_FN,
    SUPERNUMERARY_PMSSS
}

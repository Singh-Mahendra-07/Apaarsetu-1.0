package com.apaarsetu.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: FlagResolution.java
 * Package: com.apaarsetu.domain.enums
 * Component: FlagResolution (enum)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines standard domain constants for 'FlagResolution' used across the APAARSetu registry and database.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Enumerates all valid system values for FlagResolution.
 * 2. Enforces type-safe domain modeling and ensures database integrity in MongoDB.
 * 3. Serialized to JSON strings in API responses and mirrored in frontend TypeScript types.
 * ============================================================================
 */
public enum FlagResolution {
    APPROVE_TRANSFER,
    REJECT_DUPLICATE,
    DISMISS_FLAG,
    ALLOW_EXCEPTION,
    VERIFIED_GENUINE;

    @JsonCreator
    public static FlagResolution fromString(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            return FlagResolution.valueOf(val.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown or unsupported flag resolution: " + val);
        }
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}

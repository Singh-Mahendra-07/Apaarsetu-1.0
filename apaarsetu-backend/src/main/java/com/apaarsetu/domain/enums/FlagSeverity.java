package com.apaarsetu.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: FlagSeverity.java
 * Package: com.apaarsetu.domain.enums
 * Component: FlagSeverity (enum)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines standard domain constants for 'FlagSeverity' used across the APAARSetu registry and database.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Enumerates all valid system values for FlagSeverity.
 * 2. Enforces type-safe domain modeling and ensures database integrity in MongoDB.
 * 3. Serialized to JSON strings in API responses and mirrored in frontend TypeScript types.
 * ============================================================================
 */
public enum FlagSeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    @JsonCreator
    public static FlagSeverity fromString(String value) {
        if (value == null) return MEDIUM;
        String upper = value.trim().toUpperCase();
        if ("CRIT".equals(upper)) return CRITICAL;
        try {
            return FlagSeverity.valueOf(upper);
        } catch (IllegalArgumentException e) {
            return MEDIUM;
        }
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}

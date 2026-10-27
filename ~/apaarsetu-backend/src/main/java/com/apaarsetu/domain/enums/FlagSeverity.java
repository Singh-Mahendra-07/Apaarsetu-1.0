package com.apaarsetu.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

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

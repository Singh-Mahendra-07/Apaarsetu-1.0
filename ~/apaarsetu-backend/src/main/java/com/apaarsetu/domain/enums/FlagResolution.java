package com.apaarsetu.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum FlagResolution {
    APPROVE_TRANSFER,
    REJECT_DUPLICATE,
    DISMISS_FLAG,
    ALLOW_EXCEPTION,
    VERIFIED_GENUINE;

    @JsonCreator
    public static FlagResolution fromString(String val) {
        if (val == null) return null;
        try {
            return FlagResolution.valueOf(val.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return DISMISS_FLAG;
        }
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}

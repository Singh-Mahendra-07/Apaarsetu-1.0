package com.apaarsetu.common.exception;

import org.springframework.http.HttpStatus;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ValidationException.java
 * Package: com.apaarsetu.common.exception
 * Component: ValidationException (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Thrown when business logic validation rules (e.g., intake quota exceeded, invalid APAAR checksum, invalid age) fail.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends ApiException with HTTP 422 UNPROCESSABLE_ENTITY or HTTP 400 BAD_REQUEST.
 * 2. Accompanies detailed error maps indicating the exact offending attributes.
 * ============================================================================
 */
public class ValidationException extends ApiException {
    public ValidationException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "VALIDATION_FAILED");
    }

    public ValidationException(String message, Object details) {
        super(message, HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", details);
    }
}

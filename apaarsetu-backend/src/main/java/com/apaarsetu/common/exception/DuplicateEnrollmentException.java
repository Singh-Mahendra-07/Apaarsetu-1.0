package com.apaarsetu.common.exception;

import org.springframework.http.HttpStatus;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: DuplicateEnrollmentException.java
 * Package: com.apaarsetu.common.exception
 * Component: DuplicateEnrollmentException (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Enforces AICTE regulatory policy against duplicate candidate admissions, preventing a student from being concurrently enrolled in multiple regular degree programs across institutions for the same academic cycle.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends ApiException with HTTP 409 CONFLICT.
 * 2. Thrown by StudentService and ValidationEngine upon detecting existing active enrollments with matching APAAR ID.
 * ============================================================================
 */
public class DuplicateEnrollmentException extends ApiException {
    public DuplicateEnrollmentException(String message) {
        super(message, HttpStatus.CONFLICT, "DUPLICATE_ENROLLMENT");
    }

    public DuplicateEnrollmentException(String message, Object details) {
        super(message, HttpStatus.CONFLICT, "DUPLICATE_ENROLLMENT", details);
    }
}

package com.apaarsetu.common.exception;

import org.springframework.http.HttpStatus;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: BadRequestException.java
 * Package: com.apaarsetu.common.exception
 * Component: BadRequestException (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Thrown when client input fails semantic or structural business checks that are not caught by standard bean validation.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends ApiException with HTTP 400 BAD_REQUEST.
 * 2. Captured by GlobalExceptionHandler to return structured error envelopes to the frontend.
 * ============================================================================
 */
public class BadRequestException extends ApiException {
    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
    }

    public BadRequestException(String message, Object details) {
        super(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST", details);
    }
}

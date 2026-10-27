package com.apaarsetu.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ApiException.java
 * Package: com.apaarsetu.common.exception
 * Component: ApiException (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Serves as the root unchecked exception for all APAARSetu domain-specific business and regulatory errors.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends RuntimeException to enable transactional rollbacks and non-intrusive exception propagation.
 * 2. Stores an HTTP HttpStatus code and a unique machine-readable errorCode alongside a descriptive message.
 * ============================================================================
 */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;
    private final Object details;

    public ApiException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
        this.details = null;
    }

    public ApiException(String message, HttpStatus status, String errorCode, Object details) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
        this.details = details;
    }
}

package com.apaarsetu.common.exception;

import org.springframework.http.HttpStatus;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: UnauthorizedException.java
 * Package: com.apaarsetu.common.exception
 * Component: UnauthorizedException (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Thrown when authentication credentials (JWT token, password, API key) are missing, expired, revoked, or cryptographically invalid.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends ApiException with HTTP 401 UNAUTHORIZED.
 * 2. Prompts the frontend API client to trigger token refresh or redirect to the login gateway.
 * ============================================================================
 */
public class UnauthorizedException extends ApiException {
    public UnauthorizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }
}

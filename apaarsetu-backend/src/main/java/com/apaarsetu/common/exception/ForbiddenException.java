package com.apaarsetu.common.exception;

import org.springframework.http.HttpStatus;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ForbiddenException.java
 * Package: com.apaarsetu.common.exception
 * Component: ForbiddenException (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Enforces Role-Based Access Control (RBAC) and multi-tenant data boundaries when an authenticated user attempts an unauthorized action.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends ApiException with HTTP 403 FORBIDDEN.
 * 2. Thrown when institution operators attempt to access records outside their assigned institution or non-admin users attempt admin operations.
 * ============================================================================
 */
public class ForbiddenException extends ApiException {
    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
    }
}

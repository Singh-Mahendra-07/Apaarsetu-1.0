package com.apaarsetu.common.exception;

import org.springframework.http.HttpStatus;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ResourceNotFoundException.java
 * Package: com.apaarsetu.common.exception
 * Component: ResourceNotFoundException (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Thrown when a requested entity (Student, Institution, Batch, User, Flag) does not exist in the database.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends ApiException with HTTP 404 NOT_FOUND.
 * 2. Provides formatted constructor accepting entity name, field name, and queried value for precise logging.
 * ============================================================================
 */
public class ResourceNotFoundException extends ApiException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue),
                HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }
}

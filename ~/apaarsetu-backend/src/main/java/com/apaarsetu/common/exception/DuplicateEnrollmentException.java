package com.apaarsetu.common.exception;

import org.springframework.http.HttpStatus;

public class DuplicateEnrollmentException extends ApiException {
    public DuplicateEnrollmentException(String message) {
        super(message, HttpStatus.CONFLICT, "DUPLICATE_ENROLLMENT");
    }

    public DuplicateEnrollmentException(String message, Object details) {
        super(message, HttpStatus.CONFLICT, "DUPLICATE_ENROLLMENT", details);
    }
}

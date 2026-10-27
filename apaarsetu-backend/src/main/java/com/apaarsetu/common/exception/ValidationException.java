package com.apaarsetu.common.exception;

import org.springframework.http.HttpStatus;

public class ValidationException extends ApiException {
    public ValidationException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "VALIDATION_FAILED");
    }

    public ValidationException(String message, Object details) {
        super(message, HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", details);
    }
}

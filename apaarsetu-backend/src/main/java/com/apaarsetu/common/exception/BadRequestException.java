package com.apaarsetu.common.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends ApiException {
    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
    }

    public BadRequestException(String message, Object details) {
        super(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST", details);
    }
}

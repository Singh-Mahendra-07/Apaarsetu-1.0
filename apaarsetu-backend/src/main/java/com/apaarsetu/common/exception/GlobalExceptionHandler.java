package com.apaarsetu.common.exception;

import com.apaarsetu.common.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;
import java.util.*;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Object>> handleApiException(ApiException ex) {
        log.warn("API Exception: {} [{}]", ex.getMessage(), ex.getErrorCode());
        Object dataObj = ex.getDetails() != null ? ex.getDetails() : Map.of(
                "code", ex.getErrorCode(),
                "message", ex.getMessage()
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .errorCode(ex.getErrorCode())
                .code(ex.getErrorCode())
                .data(dataObj)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        List<Map<String, String>> details = new ArrayList<>();
        String firstField = null;
        Object firstRejectedValue = null;
        String firstMessage = "Validation failed";

        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            if (firstField == null) {
                firstField = fe.getField();
                firstRejectedValue = fe.getRejectedValue();
                firstMessage = fe.getDefaultMessage();
            }
            Map<String, String> errMap = new HashMap<>();
            errMap.put("field", fe.getField());
            errMap.put("issue", fe.getDefaultMessage());
            details.add(errMap);
        }

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", "VALIDATION_FAILED");
        errorData.put("message", firstMessage);
        errorData.put("field", firstField);
        errorData.put("rejectedValue", firstRejectedValue);
        errorData.put("details", details);

        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message("Validation failed: " + firstMessage)
                .errorCode("VALIDATION_FAILED")
                .code("VALIDATION_FAILED")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentialsException(BadCredentialsException ex) {
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank()) ? ex.getMessage() : "Invalid email or password";
        Map<String, Object> errorData = Map.of(
                "code", "BAD_CREDENTIALS",
                "message", msg
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message(msg)
                .errorCode("BAD_CREDENTIALS")
                .code("BAD_CREDENTIALS")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthenticationException(AuthenticationException ex) {
        Map<String, Object> errorData = Map.of(
                "code", "UNAUTHORIZED",
                "message", ex.getMessage()
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message(ex.getMessage() != null ? ex.getMessage() : "Authentication required")
                .errorCode("UNAUTHORIZED")
                .code("UNAUTHORIZED")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(AccessDeniedException ex) {
        Map<String, Object> errorData = Map.of(
                "code", "FORBIDDEN",
                "message", "Access denied: insufficient permissions or scope"
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message("You do not have permission to perform this action")
                .errorCode("FORBIDDEN")
                .code("FORBIDDEN")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Object>> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        Map<String, Object> errorData = Map.of(
                "code", "PAYLOAD_TOO_LARGE",
                "message", "Uploaded file exceeds maximum allowed size"
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message("Uploaded file exceeds maximum allowed size limit")
                .errorCode("PAYLOAD_TOO_LARGE")
                .code("PAYLOAD_TOO_LARGE")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Object>> handleMissingParam(MissingServletRequestParameterException ex) {
        Map<String, Object> errorData = Map.of(
                "code", "MISSING_PARAMETER",
                "message", "Required parameter '" + ex.getParameterName() + "' is missing"
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message("Required query parameter '" + ex.getParameterName() + "' is missing")
                .errorCode("MISSING_PARAMETER")
                .code("MISSING_PARAMETER")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(org.springframework.dao.DuplicateKeyException.class)
    public ResponseEntity<ApiResponse<Object>> handleDuplicateKeyException(org.springframework.dao.DuplicateKeyException ex) {
        log.warn("Duplicate key constraint violation: {}", ex.getMessage());
        Map<String, Object> errorData = Map.of(
                "code", "DUPLICATE_RESOURCE",
                "message", "A record with the specified unique identifier or key already exists."
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message("A resource with the specified identifier or unique attribute already exists.")
                .errorCode("DUPLICATE_RESOURCE")
                .code("DUPLICATE_RESOURCE")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(org.springframework.dao.DataAccessException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataAccessException(org.springframework.dao.DataAccessException ex) {
        log.error("Database persistence exception: ", ex);
        Map<String, Object> errorData = Map.of(
                "code", "DATABASE_ERROR",
                "message", "Database operation encountered an unexpected error. Please contact system support."
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message("Database operation encountered an unexpected error.")
                .errorCode("DATABASE_ERROR")
                .code("DATABASE_ERROR")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleMalformedJson(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.warn("Malformed HTTP request body: {}", ex.getMessage());
        Map<String, Object> errorData = Map.of(
                "code", "MALFORMED_REQUEST",
                "message", "Malformed or unreadable JSON payload provided in request body."
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message("Malformed request payload. Please verify JSON syntax.")
                .errorCode("MALFORMED_REQUEST")
                .code("MALFORMED_REQUEST")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Illegal argument error: {}", ex.getMessage());
        Map<String, Object> errorData = Map.of(
                "code", "INVALID_ARGUMENT",
                "message", ex.getMessage() != null ? ex.getMessage() : "Invalid argument provided."
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message(ex.getMessage() != null ? ex.getMessage() : "Invalid argument provided.")
                .errorCode("INVALID_ARGUMENT")
                .code("INVALID_ARGUMENT")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        log.debug("Resource not found: {}", ex.getResourcePath());
        Map<String, Object> errorData = Map.of(
                "code", "NOT_FOUND",
                "message", "The requested resource '/" + ex.getResourcePath() + "' was not found."
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message("Resource not found.")
                .errorCode("NOT_FOUND")
                .code("NOT_FOUND")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        log.error("Unhandled server exception: ", ex);
        Map<String, Object> errorData = Map.of(
                "code", "INTERNAL_SERVER_ERROR",
                "message", "An unexpected internal server error occurred. Please contact system support."
        );
        ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message("An internal server error occurred.")
                .errorCode("INTERNAL_SERVER_ERROR")
                .code("INTERNAL_SERVER_ERROR")
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}

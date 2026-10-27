package com.apaarsetu.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ApiResponse.java
 * Package: com.apaarsetu.common.dto
 * Component: ApiResponse (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Provides a unified, consistent JSON response envelope for all REST API endpoints across APAARSetu. Enables the Next.js frontend to reliably process success states, payload data, timestamps, and error codes.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Encapsulates standard fields: 'success' (boolean), 'message' (String), 'data' (generic T), 'errorCode' (String), and 'timestamp'.
 * 2. Provides static factory methods success(data), success(message, data), and error(message, errorCode) for clean controller returns.
 * 3. Jackson @JsonInclude(Include.ALWAYS) ensures predictable contract serialization across all API consumers.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.ALWAYS)
public class ApiResponse<T> {

    @Builder.Default
    private boolean success = true;

    private String message;

    private String errorCode;

    private String code;

    private T data;

    @Builder.Default
    private String timestamp = Instant.now().toString();

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("Operation completed successfully")
                .errorCode(null)
                .code(null)
                .data(data)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .errorCode(null)
                .code(null)
                .data(data)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .code(errorCode)
                .data(null)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String errorCode, T errorData) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .code(errorCode)
                .data(errorData)
                .timestamp(Instant.now().toString())
                .build();
    }
}

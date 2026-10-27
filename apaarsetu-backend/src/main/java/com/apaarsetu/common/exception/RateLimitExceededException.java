package com.apaarsetu.common.exception;

import org.springframework.http.HttpStatus;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: RateLimitExceededException.java
 * Package: com.apaarsetu.common.exception
 * Component: RateLimitExceededException (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Thrown when an IP address, user, or API key exceeds the configured request rate threshold, mitigating DDoS and brute-force attacks.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends ApiException with HTTP 429 TOO_MANY_REQUESTS.
 * 2. Intercepted by RateLimitFilter to alert consumers of throttling limits and retry durations.
 * ============================================================================
 */
public class RateLimitExceededException extends ApiException {
    public RateLimitExceededException(String message) {
        super(message, HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED");
    }
}

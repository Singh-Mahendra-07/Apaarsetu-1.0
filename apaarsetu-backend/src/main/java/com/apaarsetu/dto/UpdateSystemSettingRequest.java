/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: UpdateSystemSettingRequest.java
 * Package: com.apaarsetu.dto
 * Component: UpdateSystemSettingRequest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Submits administrative changes to global platform runtime configuration settings.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains setting key, new string/boolean value, and description of policy adjustment.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
package com.apaarsetu.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateSystemSettingRequest(
        @Min(value = 1, message = "Requests per minute must be at least 1")
        @Max(value = 100000, message = "Requests per minute cannot exceed 100,000")
        Integer requestsPerMinute,

        @Min(value = 1, message = "Verification per minute must be at least 1")
        @Max(value = 100000, message = "Verification per minute cannot exceed 100,000")
        Integer verificationPerMinute,

        @Min(value = 10, message = "Max batch rows must be at least 10")
        @Max(value = 50000, message = "Max batch rows cannot exceed 50,000")
        Integer maxBatchRows,

        Boolean autoFlagDuplicates,
        Boolean maintenanceMode
) {}

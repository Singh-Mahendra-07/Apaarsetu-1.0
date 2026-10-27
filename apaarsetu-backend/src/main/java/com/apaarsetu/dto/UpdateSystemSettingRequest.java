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

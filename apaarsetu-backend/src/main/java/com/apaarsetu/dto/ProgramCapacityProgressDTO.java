package com.apaarsetu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ProgramCapacityProgressDTO.java
 * Package: com.apaarsetu.dto
 * Component: ProgramCapacityProgressDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Calculates and conveys current seat occupancy versus approved quota for a specific program.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains programCode, programName, approvedIntake, enrolledCount, remainingSeats, and occupancyPercentage.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgramCapacityProgressDTO {

    private String programCode;
    private String programName;
    private int regularApproved;
    private int regularFilled;

    @Builder.Default
    private Map<String, Integer> supernumeraryQuota = new HashMap<>();

    @Builder.Default
    private Map<String, Integer> supernumeraryFilled = new HashMap<>();

    private boolean regularCapacityExceeded;
    private double regularFillRatePercent;
}

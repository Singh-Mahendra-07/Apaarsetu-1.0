package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: BatchSummaryDTO.java
 * Package: com.apaarsetu.dto
 * Component: BatchSummaryDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Transfers summary metrics for institutional batch processing history.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Aggregates total batches submitted, total students admitted via bulk upload, pending approvals, and error rates.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchSummaryDTO {

    private int totalRows;
    private int accepted;
    private int formatErrors;
    private int crossInstitutionConflicts;
    private int capacityOverflowCount;
    private int pendingVerification;

    @JsonProperty("validatedCount")
    public int getValidatedCount() {
        return this.accepted;
    }

    @JsonProperty("invalidFormatCount")
    public int getInvalidFormatCount() {
        return this.formatErrors;
    }

    @JsonProperty("duplicateCount")
    public int getDuplicateCount() {
        return this.crossInstitutionConflicts;
    }

    @JsonProperty("anomalyFlagCount")
    public int getAnomalyFlagCount() {
        return this.capacityOverflowCount + this.crossInstitutionConflicts;
    }
}

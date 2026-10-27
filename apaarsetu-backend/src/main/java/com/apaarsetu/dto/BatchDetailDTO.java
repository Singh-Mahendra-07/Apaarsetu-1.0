package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.BatchStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: BatchDetailDTO.java
 * Package: com.apaarsetu.dto
 * Component: BatchDetailDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Provides comprehensive details and processing metrics for a specific bulk student CSV upload batch.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Carries batch ID, original filename, total rows count, processed count, validation errors list, and approval lifecycle status.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchDetailDTO {

    private String id;
    private String institutionId;
    private String academicYear;
    private String programCode;
    private String fileName;
    private BatchStatus status;
    private BatchSummaryDTO summary;

    @Builder.Default
    private List<BatchErrorDTO> errors = new ArrayList<>();

    private BatchResponseDTO batch;

    @JsonProperty("validRecordsCount")
    public int getValidRecordsCount() {
        return summary != null ? summary.getAccepted() : 0;
    }

    @JsonProperty("invalidRecordsCount")
    public int getInvalidRecordsCount() {
        return summary != null ? (summary.getFormatErrors() + summary.getCrossInstitutionConflicts() + summary.getCapacityOverflowCount()) : 0;
    }
}

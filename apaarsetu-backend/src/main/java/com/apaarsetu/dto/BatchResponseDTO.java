package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.BatchStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: BatchResponseDTO.java
 * Package: com.apaarsetu.dto
 * Component: BatchResponseDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Lightweight receipt returned immediately to the client upon initiating a bulk student CSV upload.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains the newly generated batch UUID, initial status (UPLOADED), total rows parsed, and async status poll URL.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchResponseDTO {

    private String id;
    private String institutionId;
    private String fileName;
    private String academicYear;
    private BatchStatus status;
    private BatchSummaryDTO summary;
    private String createdAt;
    private String completedAt;
    private String rejectionReason;
    private String rejectedBy;
    private String rejectedAt;

    @JsonProperty("validRecordsCount")
    public int getValidRecordsCount() {
        return summary != null ? summary.getAccepted() : 0;
    }

    @JsonProperty("invalidRecordsCount")
    public int getInvalidRecordsCount() {
        return summary != null ? (summary.getFormatErrors() + summary.getCrossInstitutionConflicts() + summary.getCapacityOverflowCount()) : 0;
    }
}

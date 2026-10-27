package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.BatchStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

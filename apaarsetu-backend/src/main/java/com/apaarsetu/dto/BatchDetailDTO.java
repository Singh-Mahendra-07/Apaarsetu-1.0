package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.BatchStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

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

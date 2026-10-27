package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

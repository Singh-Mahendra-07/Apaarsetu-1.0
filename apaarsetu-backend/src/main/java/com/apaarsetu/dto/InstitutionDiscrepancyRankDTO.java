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
public class InstitutionDiscrepancyRankDTO {

    private String aicteId;
    private String name;
    private String state;
    private int totalReported;
    private int totalValidated;
    private int actionRequired;
    private double discrepancyRate;

    @JsonProperty("institutionId")
    public String getInstitutionId() {
        return this.aicteId;
    }

    @JsonProperty("institutionName")
    public String getInstitutionName() {
        return this.name;
    }

    @JsonProperty("totalActionRequired")
    public int getTotalActionRequired() {
        return this.actionRequired;
    }
}

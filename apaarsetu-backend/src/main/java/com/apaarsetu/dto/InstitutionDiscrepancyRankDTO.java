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
 * File: InstitutionDiscrepancyRankDTO.java
 * Package: com.apaarsetu.dto
 * Component: InstitutionDiscrepancyRankDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Ranks institutions by risk level based on historical discrepancy frequency and capacity violation density.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Used by AICTE national officers to prioritize audits, containing institution code, name, zone, total flags, and risk rating.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
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

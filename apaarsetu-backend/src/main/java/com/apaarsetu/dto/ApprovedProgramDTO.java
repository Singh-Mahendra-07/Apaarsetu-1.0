package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ApprovedProgramDTO.java
 * Package: com.apaarsetu.dto
 * Component: ApprovedProgramDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Transfers academic program details, degree levels, and AICTE-approved maximum annual student intake capacity.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains programCode (e.g. CS101), programName, approvedSeats, academicYear, and supernumerary seat allowance limits.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovedProgramDTO {

    @JsonAlias({"programCode", "code"})
    private String programCode;

    @JsonAlias({"programName", "name"})
    private String programName;

    private String level;
    private int duration;

    @JsonAlias({"approvedIntake", "intake"})
    private int approvedIntake;

    private String academicYear;

    @Builder.Default
    @JsonAlias({"supernumeraryQuota", "quotas"})
    private SupernumeraryQuotaDTO supernumeraryQuota = new SupernumeraryQuotaDTO();

    @JsonProperty("code")
    public String getCode() {
        return this.programCode;
    }

    @JsonProperty("name")
    public String getName() {
        return this.programName;
    }

    @JsonProperty("intake")
    public int getIntake() {
        return this.approvedIntake;
    }

    @JsonProperty("quotas")
    public SupernumeraryQuotaDTO getQuotas() {
        return this.supernumeraryQuota != null ? this.supernumeraryQuota : new SupernumeraryQuotaDTO();
    }
}

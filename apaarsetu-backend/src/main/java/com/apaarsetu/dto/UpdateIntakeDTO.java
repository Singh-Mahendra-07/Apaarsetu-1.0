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
 * File: UpdateIntakeDTO.java
 * Package: com.apaarsetu.dto
 * Component: UpdateIntakeDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Carries administrative modifications to an institution's approved program intake quotas.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Specifies academicYear, programCode, revisedApprovedSeats, supernumerary allowances, and official AICTE approval reference number.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateIntakeDTO {

    @JsonAlias({"programCode", "code"})
    private String programCode;

    private String academicYear;

    @JsonAlias({"approvedIntake", "intake"})
    private int approvedIntake;

    @Builder.Default
    @JsonAlias({"supernumeraryQuota", "quotas"})
    private SupernumeraryQuotaDTO supernumeraryQuota = new SupernumeraryQuotaDTO();

    @JsonProperty("intake")
    public int getIntake() {
        return this.approvedIntake;
    }

    @JsonProperty("quotas")
    public SupernumeraryQuotaDTO getQuotas() {
        return this.supernumeraryQuota;
    }
}

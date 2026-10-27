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
 * File: SupernumeraryQuotaDTO.java
 * Package: com.apaarsetu.dto
 * Component: SupernumeraryQuotaDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines approved seat allowances for government-mandated supernumerary categories beyond standard program intake.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Details quotas for EWS (10%), TFW (Tuition Fee Waiver 5%), Sports Quota, PMSSS (J&K scholarship), and PwD.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupernumeraryQuotaDTO {
    @Builder.Default
    @JsonAlias({"nri", "kmQuota"})
    private int nri = 0;

    @Builder.Default
    @JsonAlias({"ociFn", "fnQuota"})
    private int ociFn = 0;

    @Builder.Default
    @JsonAlias({"tfw", "tfwsQuota"})
    private int tfw = 0;

    @Builder.Default
    @JsonAlias({"ews"})
    private int ews = 0;

    @Builder.Default
    @JsonAlias({"pmsss", "jkQuota"})
    private int pmsss = 0;

    @JsonProperty("tfwsQuota")
    public int getTfwsQuota() {
        return this.tfw;
    }

    @JsonProperty("fnQuota")
    public int getFnQuota() {
        return this.ociFn;
    }

    @JsonProperty("jkQuota")
    public int getJkQuota() {
        return this.pmsss;
    }

    @JsonProperty("kmQuota")
    public int getKmQuota() {
        return this.nri;
    }

    @JsonProperty("ocifn")
    public int getOcifn() {
        return this.ociFn;
    }

    public int getOciFn() {
        return this.ociFn;
    }
}

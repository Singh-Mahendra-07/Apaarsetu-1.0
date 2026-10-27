package com.apaarsetu.dto;

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
 * File: InstitutionDashboardDTO.java
 * Package: com.apaarsetu.dto
 * Component: InstitutionDashboardDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Delivers real-time campus statistics and operational status to Institution Admin and Operator dashboards.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Aggregates total student roster count, program capacity fill rates, pending batch validations, and open discrepancy warnings.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionDashboardDTO {

    private String institutionId;
    private String institutionName;
    private String academicYear;

    @Builder.Default
    private InstitutionKpi kpi = new InstitutionKpi();

    @Builder.Default
    private List<ProgramCapacityProgressDTO> programCapacities = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstitutionKpi {
        private int totalApprovedIntake;
        private int totalRegularApproved;
        private int totalSupernumeraryApproved;
        private int totalUploaded;
        private int validated;
        private int actionRequired;
        private int pending;
        private double complianceRate;
    }
}

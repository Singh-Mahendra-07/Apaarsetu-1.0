package com.apaarsetu.dto;

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

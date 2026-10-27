package com.apaarsetu.dto;

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
public class ComplianceOverviewDTO {

    @Builder.Default
    private List<ComplianceRow> rows = new ArrayList<>();

    @Builder.Default
    private ComplianceSummary summary = new ComplianceSummary();

    @Builder.Default
    private boolean success = true;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComplianceRow {
        private String id;
        private String name;
        private String affiliation;
        private String submission; // ON_TIME, LATE, NOT_UPLOADED
        private int daysLate;
        private double validationRatio; // 0-100
        private String intakeStatus; // COMPLIANT, OVER, UNKNOWN
        private int overBy;
        private int pendingDisputes;
        private int overdueDisputes;
        private int tier; // 1, 2, 3
        private String defects;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComplianceSummary {
        private double cleanRatio;
        private int onTime;
        private int totalColleges;
        private int intakeBreaches;
        private int activeNotices;
    }
}

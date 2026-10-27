package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NationalDashboardDTO {

    private long totalInstitutions;
    private long reportedInstitutions;
    private long totalEnrolled;
    private long totalValidated;
    private double validationGapPercent;
    private int violationAlerts;
    private int duplicateQueueCount;

    @Builder.Default
    private String academicYear = "2026-27";

    @Builder.Default
    private List<InstitutionRowDTO> institutions = new ArrayList<>();

    @Builder.Default
    private List<CapacityViolationItemDTO> capacityViolations = new ArrayList<>();

    @Builder.Default
    private List<AnomalyItemDTO> anomalies = new ArrayList<>();

    @Builder.Default
    private List<InstitutionDiscrepancyRankDTO> topDiscrepancies = new ArrayList<>();

    @JsonProperty("participatingInstitutions")
    public long getParticipatingInstitutions() {
        return this.reportedInstitutions;
    }

    @JsonProperty("totalReported")
    public long getTotalReported() {
        return this.totalEnrolled;
    }

    @JsonProperty("totalStudentsEnrolled")
    public long getTotalStudentsEnrolled() {
        return this.totalEnrolled;
    }

    @JsonProperty("totalStudentsReported")
    public long getTotalStudentsReported() {
        return this.totalEnrolled;
    }

    @JsonProperty("validatedApaarRecords")
    public long getValidatedApaarRecords() {
        return this.totalValidated;
    }

    @JsonProperty("overCapacityCount")
    public int getOverCapacityCount() {
        return this.violationAlerts;
    }

    @JsonProperty("duplicateFlagCount")
    public int getDuplicateFlagCount() {
        return this.duplicateQueueCount;
    }

    @JsonProperty("unverifiedGapPercent")
    public double getUnverifiedGapPercent() {
        return this.validationGapPercent;
    }

    @JsonProperty("discrepancyTable")
    public List<InstitutionDiscrepancyRankDTO> getDiscrepancyTable() {
        return this.topDiscrepancies;
    }

    @JsonProperty("success")
    public boolean isSuccess() {
        return true;
    }

    @JsonProperty("message")
    public String getMessage() {
        return "National dashboard metrics retrieved successfully";
    }

    @JsonProperty("code")
    public String getCode() {
        return null;
    }

    @JsonProperty("errorCode")
    public String getErrorCode() {
        return null;
    }

    @JsonProperty("data")
    public Map<String, Object> getData() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("totalInstitutions", this.totalInstitutions);
        map.put("reportedInstitutions", this.reportedInstitutions);
        map.put("participatingInstitutions", getParticipatingInstitutions());
        map.put("totalEnrolled", this.totalEnrolled);
        map.put("totalReported", getTotalReported());
        map.put("totalStudentsEnrolled", getTotalStudentsEnrolled());
        map.put("totalStudentsReported", getTotalStudentsReported());
        map.put("totalValidated", this.totalValidated);
        map.put("validatedApaarRecords", getValidatedApaarRecords());
        map.put("validationGapPercent", this.validationGapPercent);
        map.put("unverifiedGapPercent", getUnverifiedGapPercent());
        map.put("violationAlerts", this.violationAlerts);
        map.put("overCapacityCount", getOverCapacityCount());
        map.put("duplicateQueueCount", this.duplicateQueueCount);
        map.put("duplicateFlagCount", getDuplicateFlagCount());
        map.put("academicYear", this.academicYear);
        map.put("institutions", this.institutions);
        map.put("capacityViolations", this.capacityViolations);
        map.put("anomalies", this.anomalies);
        map.put("topDiscrepancies", this.topDiscrepancies);
        map.put("discrepancyTable", getDiscrepancyTable());
        return map;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstitutionRowDTO {
        private String id;
        private String name;
        private String aicteId;
        private String state;
        private int reported;
        private int validated;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CapacityViolationItemDTO {
        private String institution;
        private String state;
        private String program;
        private int enrolled;
        private int capacity;
        @Builder.Default
        private List<String> checks = List.of("EWS", "NRI");
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnomalyItemDTO {
        private String type;
        private String apaarMasked;
        private String message;
    }
}

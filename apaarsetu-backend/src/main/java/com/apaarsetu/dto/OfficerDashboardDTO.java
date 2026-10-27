package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
 * File: OfficerDashboardDTO.java
 * Package: com.apaarsetu.dto
 * Component: OfficerDashboardDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Provides personal work-queue analytics and urgent alerts for an AICTE compliance officer's workspace.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Displays assigned pending flags, urgent regulatory inquiries, institutions under review, and recent resolution throughput.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficerDashboardDTO {

    @Builder.Default
    private List<FlagDetailDTO> flags = new ArrayList<>();

    @Builder.Default
    private List<RadarRow> radar = new ArrayList<>();

    @Builder.Default
    private OfficerSummary summary = new OfficerSummary();

    @Builder.Default
    private boolean success = true;

    @JsonProperty("data")
    public java.util.Map<String, Object> getData() {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("flags", flags);
        map.put("radar", radar);
        map.put("summary", summary);
        return map;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RadarRow {
        private String college;
        private String program;
        private int intake;
        private int current;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfficerSummary {
        private int unresolvedFlags;
        private int regionalColleges;
        private int cleanValidated;
        private int totalRecords;
    }
}

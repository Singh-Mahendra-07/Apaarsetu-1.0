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

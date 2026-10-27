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
public class OfficerDTO {
    private String id;
    private String name;
    private String email;
    private String zone;
    private String duty; // ON_DUTY, ON_LEAVE, SUSPENDED
    private int open;
    private int resolved;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfficerSummary {
        private int criticalFlags;
        private double turnaroundHrs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfficerManagementResponse {
        @Builder.Default
        private List<OfficerDTO> officers = new ArrayList<>();

        @Builder.Default
        private OfficerSummary summary = new OfficerSummary();

        @Builder.Default
        private boolean success = true;

        @JsonProperty("data")
        public java.util.Map<String, Object> getData() {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("officers", officers);
            map.put("summary", summary);
            return map;
        }
    }
}

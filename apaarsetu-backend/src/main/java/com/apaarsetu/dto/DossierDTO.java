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
public class DossierDTO {

    private String zone;
    private String state;
    private String affiliation;
    private String status;
    private String validity;
    private String lastSync;

    @Builder.Default
    private List<DossierProgramRow> programs = new ArrayList<>();

    @Builder.Default
    private List<DossierFlaggedStudent> flaggedStudents = new ArrayList<>();

    @Builder.Default
    private List<DossierSyncLog> syncLogs = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DossierProgramRow {
        private String code;
        private String degree;
        private int approved;
        private int enrolled;
        private int tfw;
        private int ews;
        private int nri;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DossierFlaggedStudent {
        private String name;
        private String apaarId;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DossierSyncLog {
        private String at;
        private boolean ok;
        private int records;
        private String message;
    }
}

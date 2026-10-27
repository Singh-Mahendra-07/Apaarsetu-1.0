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
 * File: DossierDTO.java
 * Package: com.apaarsetu.dto
 * Component: DossierDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Transfers a complete candidate academic dossier combining verified credentials, personal details, and admission timeline.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Assembled for authorized verification agencies and institutional review, containing student profile, academic history, and validation audit stamps.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
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

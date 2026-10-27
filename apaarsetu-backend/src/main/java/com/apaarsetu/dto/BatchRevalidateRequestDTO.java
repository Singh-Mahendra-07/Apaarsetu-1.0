package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: BatchRevalidateRequestDTO.java
 * Package: com.apaarsetu.dto
 * Component: BatchRevalidateRequestDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Carries corrected row data submitted by institution operators to re-run validation without re-uploading the entire CSV.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains the batch ID, list of corrected row indexes, and updated student field values for re-verification.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchRevalidateRequestDTO {

    @Builder.Default
    private List<CorrectionItem> corrections = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CorrectionItem {
        private int rowNumber;
        private String studentName;
        private String apaarId;
        private String fieldName;
        private String invalidValue;
        private String correctedValue;

        @JsonAlias({"correctedData", "studentData"})
        private Map<String, Object> correctedData;
    }
}

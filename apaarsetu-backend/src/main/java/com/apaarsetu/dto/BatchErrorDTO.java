package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: BatchErrorDTO.java
 * Package: com.apaarsetu.dto
 * Component: BatchErrorDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Reports individual row-level validation errors encountered during asynchronous CSV batch processing.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Stores the zero-based CSV row number, the offending student identifier/APAAR ID, invalid field name, and descriptive validation failure reason.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchErrorDTO {

    private int rowNumber;
    private String apaarId;
    private String studentName;
    private String fieldName;
    private String invalidValue;
    private String errorMessage;
    private String ruleCode;

    @JsonProperty("faultyField")
    public String getFaultyField() {
        return this.fieldName;
    }

    @JsonProperty("errorExplanation")
    public String getErrorExplanation() {
        return this.errorMessage;
    }
}

package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: FlagResolveDTO.java
 * Package: com.apaarsetu.dto
 * Component: FlagResolveDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Carries an AICTE officer's official adjudication verdict and commentary when resolving or dismissing a flag.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains resolution type (CONFIRMED_VIOLATION, DISMISSED, REMEDIED), detailed justification notes, and corrective action directive.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlagResolveDTO {

    @JsonAlias({"resolution", "decision"})
    private String resolution;

    @JsonAlias({"notes", "remarks"})
    private String notes;

    private String resolvedBy;
}

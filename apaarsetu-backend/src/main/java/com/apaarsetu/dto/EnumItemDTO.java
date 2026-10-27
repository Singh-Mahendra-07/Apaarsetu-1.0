package com.apaarsetu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: EnumItemDTO.java
 * Package: com.apaarsetu.dto
 * Component: EnumItemDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Standardizes system enum constants into user-friendly label/code pairs for frontend select dropdowns and filter chips.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains 'code' (e.g. 'REGULAR_GENERAL'), 'label' (e.g. 'Regular General Quota'), and optional descriptive help text.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnumItemDTO {
    private String value;
    private String label;
    private String badgeColor;
}

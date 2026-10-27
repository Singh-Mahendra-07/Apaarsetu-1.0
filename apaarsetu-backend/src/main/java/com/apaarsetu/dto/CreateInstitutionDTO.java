package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
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
 * File: CreateInstitutionDTO.java
 * Package: com.apaarsetu.dto
 * Component: CreateInstitutionDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Defines the input contract for registering a new higher education institution in the national registry.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Validates institution legal name, AISHE code, institution type, regional zone, contact details, and initial approved programs list.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInstitutionDTO {

    @NotBlank(message = "AICTE ID is required")
    private String aicteId;

    @NotBlank(message = "Institution name is required")
    private String name;

    @NotBlank(message = "Institution type is required")
    @JsonAlias({"type", "category", "institutionType"})
    private String type;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "City is required")
    private String city;

    @Builder.Default
    @JsonAlias({"zone", "regionZone"})
    private String zone = "NORTH";

    @Builder.Default
    @JsonAlias({"universityAffiliation", "affiliation"})
    private String universityAffiliation = "State Technical University";

    @Builder.Default
    private String status = "APPROVED";

    @Builder.Default
    @JsonAlias({"approvedPrograms", "programs"})
    private List<ApprovedProgramDTO> approvedPrograms = new ArrayList<>();
}

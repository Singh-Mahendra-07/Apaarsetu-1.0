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
 * File: InstitutionResponseDTO.java
 * Package: com.apaarsetu.dto
 * Component: InstitutionResponseDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Transfers complete institution profile and accreditation details to administrative consumers.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains institution ID, AISHE code, accredited name, region zone, approved program quotas, and active official contacts.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionResponseDTO {

    private String id;
    private String aicteId;
    private String name;
    private String type;
    private String state;
    private String city;
    private String zone;
    private String universityAffiliation;
    private String status;
    private String description;

    // Leadership & Nodal Authority
    private String headName;
    private String headEmail;
    private String headPhone;
    private String headStatus;

    private String nodalOfficerName;
    private String nodalOfficerEmail;
    private String nodalOfficerPhone;
    private String nodalOfficerPrivileges;

    @Builder.Default
    private List<ApprovedProgramDTO> approvedPrograms = new ArrayList<>();

    @Builder.Default
    private List<ErpApiKeyDTO> erpApiKeys = new ArrayList<>();

    // Additional aggregated fields for director pages
    private int enrolled;
    private String violation;

    @JsonProperty("category")
    public String getCategory() {
        if ("MANAGEMENT".equalsIgnoreCase(this.type)) {
            return "PGDM";
        }
        return this.type != null ? this.type : "ENGINEERING";
    }

    @JsonProperty("affiliation")
    public String getAffiliation() {
        return this.universityAffiliation;
    }

    @JsonProperty("programs")
    public List<ApprovedProgramDTO> getPrograms() {
        return this.approvedPrograms != null ? this.approvedPrograms : new ArrayList<>();
    }

    @JsonProperty("programsCount")
    public int getProgramsCount() {
        return approvedPrograms != null ? approvedPrograms.size() : 0;
    }

    @JsonProperty("approvedSeats")
    public int getApprovedSeats() {
        if (approvedPrograms == null) return 0;
        return approvedPrograms.stream().mapToInt(ApprovedProgramDTO::getApprovedIntake).sum();
    }
}

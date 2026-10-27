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

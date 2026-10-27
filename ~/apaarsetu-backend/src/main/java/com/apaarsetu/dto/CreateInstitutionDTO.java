package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
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

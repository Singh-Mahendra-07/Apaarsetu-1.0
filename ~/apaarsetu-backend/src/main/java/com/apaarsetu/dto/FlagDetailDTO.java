package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.FlagSeverity;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlagDetailDTO {

    private String id;
    private String flagType;
    private FlagSeverity severity;
    private String apaarId;
    private String studentId;
    private String studentName;
    private String conflictingStudentId;
    private String primaryInstitutionId;
    private String primaryInstitutionName;
    private String conflictingInstitutionId;
    private String conflictingInstitutionName;
    private String status;
    private String resolution;
    private String notes;
    private String createdAt;
    private String resolvedAt;
    private String resolvedBy;
    private Map<String, Object> evidence;

    @JsonProperty("flagId")
    public String getFlagId() {
        return this.id;
    }

    @JsonProperty("type")
    public String getType() {
        return this.flagType;
    }

    @JsonProperty("candidateName")
    public String getCandidateName() {
        return this.studentName;
    }

    @JsonProperty("institutionId")
    public String getInstitutionId() {
        return this.primaryInstitutionId;
    }

    @JsonProperty("institutionName")
    public String getInstitutionName() {
        return this.primaryInstitutionName;
    }

    @JsonProperty("primaryCollege")
    public String getPrimaryCollege() {
        return this.primaryInstitutionName;
    }

    @JsonProperty("conflictingCollege")
    public String getConflictingCollege() {
        return this.conflictingInstitutionName;
    }

    @JsonProperty("remarks")
    public String getRemarks() {
        return this.notes;
    }

    @JsonProperty("raisedAt")
    public String getRaisedAt() {
        return this.createdAt;
    }
}

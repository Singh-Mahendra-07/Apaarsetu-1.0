package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovedProgramDTO {

    @JsonAlias({"programCode", "code"})
    private String programCode;

    @JsonAlias({"programName", "name"})
    private String programName;

    private String level;
    private int duration;

    @JsonAlias({"approvedIntake", "intake"})
    private int approvedIntake;

    private String academicYear;

    @Builder.Default
    @JsonAlias({"supernumeraryQuota", "quotas"})
    private SupernumeraryQuotaDTO supernumeraryQuota = new SupernumeraryQuotaDTO();

    @JsonProperty("code")
    public String getCode() {
        return this.programCode;
    }

    @JsonProperty("name")
    public String getName() {
        return this.programName;
    }

    @JsonProperty("intake")
    public int getIntake() {
        return this.approvedIntake;
    }

    @JsonProperty("quotas")
    public SupernumeraryQuotaDTO getQuotas() {
        return this.supernumeraryQuota != null ? this.supernumeraryQuota : new SupernumeraryQuotaDTO();
    }
}

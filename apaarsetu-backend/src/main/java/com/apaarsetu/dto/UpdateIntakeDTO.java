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
public class UpdateIntakeDTO {

    @JsonAlias({"programCode", "code"})
    private String programCode;

    private String academicYear;

    @JsonAlias({"approvedIntake", "intake"})
    private int approvedIntake;

    @Builder.Default
    @JsonAlias({"supernumeraryQuota", "quotas"})
    private SupernumeraryQuotaDTO supernumeraryQuota = new SupernumeraryQuotaDTO();

    @JsonProperty("intake")
    public int getIntake() {
        return this.approvedIntake;
    }

    @JsonProperty("quotas")
    public SupernumeraryQuotaDTO getQuotas() {
        return this.supernumeraryQuota;
    }
}

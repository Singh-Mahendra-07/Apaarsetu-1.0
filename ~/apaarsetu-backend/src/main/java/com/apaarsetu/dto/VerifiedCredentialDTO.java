package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifiedCredentialDTO {

    private String maskedApaarId;
    private String studentName;
    private String institutionName;
    private String aicteCode;
    private String degree;
    private String branch;
    private String enrollmentStatus;
    private String admissionYear;
    private String completionYear;

    @Builder.Default
    private String sealStatus = "AUTHENTIC_VALIDATED";

    private String demographicMatchStatus;
    private String demographicConfidence;
    private String verifiedAt;
    private String certificateId;
    private String consentRef;
    private String purpose;

    @JsonProperty("verificationStatus")
    public String getVerificationStatus() {
        return "VERIFIED";
    }
}

package com.apaarsetu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationTokenDTO {
    private String id;
    private String apaarId;
    private String verifierId;
    private String verifiedAt;
    private String verificationMethod;
    private String purpose;
    private String status;
}

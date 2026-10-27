package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.VerificationPurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualVerificationRequest {

    @NotBlank(message = "APAAR ID is required")
    @Pattern(regexp = "^[0-9]{12}$", message = "APAAR ID must be exactly 12 numeric digits")
    private String apaarId;

    @NotNull(message = "Purpose is required")
    private VerificationPurpose purpose;

    @NotBlank(message = "DPDP Consent reference is required")
    private String consentRef;

    private String candidateName;
    private String dateOfBirth;
    private String gender;
}

package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MfaVerifyRequest {
    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "OTP code is required")
    private String otpCode;

    @JsonAlias({"mfaToken", "challengeToken"})
    private String challengeToken;
}

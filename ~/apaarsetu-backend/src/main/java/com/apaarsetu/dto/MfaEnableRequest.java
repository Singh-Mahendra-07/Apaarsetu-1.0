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
public class MfaEnableRequest {
    @NotBlank(message = "Secret is required")
    private String secret;

    @NotBlank(message = "Code is required")
    @JsonAlias({"code", "otpCode"})
    private String code;
}

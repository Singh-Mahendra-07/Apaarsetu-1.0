package com.apaarsetu.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationDisputeDTO {

    @NotBlank(message = "APAAR ID is required")
    private String apaarId;

    private String candidateName;

    @NotBlank(message = "Reason is required")
    private String reason;
}

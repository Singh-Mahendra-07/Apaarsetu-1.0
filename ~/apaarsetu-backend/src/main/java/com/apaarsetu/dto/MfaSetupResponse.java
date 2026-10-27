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
public class MfaSetupResponse {
    private String secret;
    private String qrCodeUri;

    @JsonProperty("qrCode")
    public String getQrCode() {
        return this.qrCodeUri;
    }
}

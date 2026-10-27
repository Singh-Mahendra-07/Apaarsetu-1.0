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
public class ErpApiKeyDTO {
    private String keyId;
    private String label;
    private String createdAt;
    private String lastUsedAt;
    private boolean active;

    @JsonProperty("lastUsed")
    public String getLastUsed() {
        return this.lastUsedAt;
    }
}

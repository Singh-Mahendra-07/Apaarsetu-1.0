package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ApiKeyResponseDTO.java
 * Package: com.apaarsetu.dto
 * Component: ApiKeyResponseDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Delivers newly generated ERP API key credentials to institutional administrators upon creation.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Carries the raw API secret token (displayed only once), the key identifier prefix, creation timestamp, and assigned permissions.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyResponseDTO {
    private String keyId;
    private String rawSecret;
    private String rawApiKey;
    private String label;
    private String createdAt;
    private String lastUsed;

    @Builder.Default
    private boolean active = true;

    @JsonProperty("keyPrefix")
    public String getKeyPrefix() {
        if (keyId != null && keyId.length() >= 4) {
            return keyId.substring(0, 4);
        }
        return keyId;
    }
}

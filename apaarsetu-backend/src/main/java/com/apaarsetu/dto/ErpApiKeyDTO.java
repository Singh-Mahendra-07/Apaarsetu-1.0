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
 * File: ErpApiKeyDTO.java
 * Package: com.apaarsetu.dto
 * Component: ErpApiKeyDTO (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Represents active API key metadata displayed in the institutional settings console.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Displays masked key prefix, creation date, last-used timestamp, expiration date, and active/revoked status.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
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

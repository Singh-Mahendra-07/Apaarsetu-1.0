package com.apaarsetu.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: RevokedToken.java
 * Package: com.apaarsetu.domain
 * Component: RevokedToken (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Stores invalidated JWT token IDs (JTI) in a TTL collection to enforce immediate logout and token revocation.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Holds tokenId, user email, and expiration timestamp.
 * 2. Checked by JwtAuthenticationFilter during every authenticated request.
 * 3. Automatically pruned by MongoDB TTL index after token expiry.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "revoked_tokens")
public class RevokedToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String tokenHash;

    private Instant revokedAt;

    @Indexed(expireAfterSeconds = 0)
    private Instant expiresAt;
}

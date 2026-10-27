package com.apaarsetu.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

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

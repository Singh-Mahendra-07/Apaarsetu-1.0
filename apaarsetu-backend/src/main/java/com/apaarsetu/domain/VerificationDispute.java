package com.apaarsetu.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: VerificationDispute.java
 * Package: com.apaarsetu.domain
 * Component: VerificationDispute (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Represents a contested candidate verification result where a candidate or college challenges a discrepancy flag.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Tracks dispute reason, attached proof documents, reviewing officer, and final adjudication outcome.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "verification_disputes")
public class VerificationDispute {

    @Id
    private String id;

    @Indexed
    private String apaarId;

    private String candidateName;

    @Indexed
    private String verifierId;

    private String verifierOrg;

    private String reason;

    @Builder.Default
    private String status = "OPEN"; // OPEN, UNDER_REVIEW, RESOLVED, REJECTED

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant resolvedAt;
}

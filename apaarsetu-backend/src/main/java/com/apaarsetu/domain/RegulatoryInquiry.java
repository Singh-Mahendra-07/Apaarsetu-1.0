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
 * File: RegulatoryInquiry.java
 * Package: com.apaarsetu.domain
 * Component: RegulatoryInquiry (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Represents a formal multi-step inquiry thread between AICTE regional officers and an institution's leadership.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Tracks inquiry topic, correspondence messages, attached evidence references, and status (PENDING_RESPONSE, CLOSED).
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "regulatory_inquiries")
public class RegulatoryInquiry {

    @Id
    private String id;

    @Indexed
    private String institutionId;

    private String message;

    @Builder.Default
    private String status = "PENDING"; // PENDING, RESPONDED, CLOSED

    private String response;

    private String sentBy;

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant respondedAt;
}

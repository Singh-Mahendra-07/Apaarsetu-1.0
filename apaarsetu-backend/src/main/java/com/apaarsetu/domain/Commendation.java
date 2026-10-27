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
 * File: Commendation.java
 * Package: com.apaarsetu.domain
 * Component: Commendation (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Domain entity recording official AICTE excellence commendations granted to institutions achieving 100% verified compliance.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Captures academic year, institution ID, criteria met, citation text, and issuing officer ID.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "commendations")
public class Commendation {

    @Id
    private String id;

    @Indexed
    private String institutionId;

    private String notes;

    private String awardedBy;

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();
}

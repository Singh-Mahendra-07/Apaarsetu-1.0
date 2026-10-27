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
import java.util.ArrayList;
import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ComplianceNotice.java
 * Package: com.apaarsetu.domain
 * Component: ComplianceNotice (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Domain document for formal regulatory violation notices issued by AICTE to colleges exceeding approved intake or admitting unverified candidates.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Records issuing officer, targeted institution, violation category, and compliance deadline.
 * 2. Tracks institution explanation responses and final regulatory disposition.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "compliance_notices")
public class ComplianceNotice {

    @Id
    private String id;

    @Indexed
    private String institutionId;

    private String noticeType;

    private String subject;

    @Builder.Default
    private List<String> recipients = new ArrayList<>();

    @Builder.Default
    private int responseDueInDays = 15;

    private Instant dueDate;

    private String chargeDetails;

    private String attachmentFileName;

    private String sentBy;

    @Builder.Default
    private String status = "ISSUED";

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();
}

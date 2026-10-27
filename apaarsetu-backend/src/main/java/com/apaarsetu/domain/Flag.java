package com.apaarsetu.domain;

import com.apaarsetu.domain.enums.FlagResolution;
import com.apaarsetu.domain.enums.FlagSeverity;
import com.apaarsetu.domain.enums.FlagStatus;
import com.apaarsetu.domain.enums.FlagType;
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
 * File: Flag.java
 * Package: com.apaarsetu.domain
 * Component: Flag (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Represents a compliance discrepancy or regulatory flag (e.g. duplicate enrollment, intake capacity breach, invalid APAAR).
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Stores flag type, severity (LOW, MEDIUM, HIGH, CRITICAL), status (OPEN, UNDER_INVESTIGATION, RESOLVED).
 * 2. Links to offending student and institution IDs with evidence notes.
 * 3. Records officer resolution comments and resolution timestamp.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "dispute_flags")
public class Flag {

    @Id
    private String id;

    private FlagType flagType;

    @Builder.Default
    private FlagSeverity severity = FlagSeverity.MEDIUM;

    @Indexed
    private String apaarId;

    @Indexed
    private String studentId;

    private String studentName;

    @Indexed
    private String primaryInstitutionId;

    private String primaryInstitutionName;

    private String conflictingInstitutionId;

    private String conflictingInstitutionName;

    private String programCode;

    private String academicYear;

    @Builder.Default
    private FlagStatus status = FlagStatus.PENDING;

    private FlagResolution resolution;

    private String notes;

    private String resolvedBy;

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant resolvedAt;
}

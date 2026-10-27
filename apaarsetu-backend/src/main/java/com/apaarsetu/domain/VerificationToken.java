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
 * File: VerificationToken.java
 * Package: com.apaarsetu.domain
 * Component: VerificationToken (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Stores time-limited, cryptographically secure verification tokens issued for authorized third-party credential checks under DPDP guidelines.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains hashed token, student ID, verifier organization name, purpose, and expiration timestamp.
 * 2. Enforces single-use or strict time-window access to prevent unauthorized candidate data harvesting.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "verification_tokens")
public class VerificationToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String tokenHash;

    private String certificateId;

    @Indexed
    private String apaarId;

    private String studentName;

    private String institutionName;

    private String aicteCode;

    private String degree;

    private String branch;

    private String enrollmentStatus;

    private String admissionYear;

    private String completionYear;

    @Builder.Default
    private String sealStatus = "AUTHENTIC_VALIDATED";

    private String demographicMatchStatus;

    private String demographicConfidence;

    @Indexed
    private String requestedBy; // verifier userId

    private String verifierOrg;

    private String purpose;

    private String consentRef;

    @Builder.Default
    private String status = "VERIFIED";

    private String verificationMethod; // QR or MANUAL

    @CreatedDate
    @Builder.Default
    private Instant verifiedAt = Instant.now();

    @Indexed(expireAfterSeconds = 0)
    private Instant expiresAt;
}

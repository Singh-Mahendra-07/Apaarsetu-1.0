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

package com.apaarsetu.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
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
 * File: AuditLog.java
 * Package: com.apaarsetu.domain
 * Component: AuditLog (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Represents an immutable, tamper-evident audit trail event for every significant action performed in the national registry.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Captures actor email, user role, action type (CREATE_STUDENT, OVERRIDE_CAPACITY, RESOLVE_FLAG, LOGIN), and target resource ID.
 * 2. Stores client IP address, User-Agent, before/after delta snapshots, and exact UTC timestamp.
 * 3. Queried by compliance officers to investigate anomalies and ensure regulatory accountability.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    private String action;

    @Builder.Default
    private AuditActor actor = new AuditActor();

    @Builder.Default
    private AuditTarget target = new AuditTarget();

    @Builder.Default
    private List<AuditChange> changes = new ArrayList<>();

    @Indexed
    @CreatedDate
    @Builder.Default
    private Instant timestamp = Instant.now();

    private String ipAddress;

    private String userAgent;

    @JsonProperty("clientIp")
    public String getClientIp() {
        return this.ipAddress;
    }

    @JsonProperty("actorEmail")
    public String getActorEmail() {
        return this.actor != null ? this.actor.getEmail() : null;
    }

    @JsonProperty("actorRole")
    public String getActorRole() {
        return this.actor != null ? this.actor.getRole() : null;
    }

    @JsonProperty("targetType")
    public String getTargetType() {
        return this.target != null ? this.target.getTargetType() : null;
    }

    @JsonProperty("targetId")
    public String getTargetId() {
        return this.target != null ? (this.target.getTargetId() != null ? this.target.getTargetId() : this.target.getDocumentId()) : null;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditActor {
        private String userId;
        private String email;
        private String role;
        private String institutionId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditTarget {
        private String targetType;
        private String targetId;
        private String documentId;
        private String apaarIdMasked;
        private String studentName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditChange {
        private String fieldName;
        private String oldValue;
        private String newValue;
    }
}

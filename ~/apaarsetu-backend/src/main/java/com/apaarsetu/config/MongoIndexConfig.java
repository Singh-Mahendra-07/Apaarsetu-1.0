package com.apaarsetu.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;

import java.time.Duration;

@Slf4j
@Configuration
@ConditionalOnProperty(name = "app.mongodb.indexes.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class MongoIndexConfig {

    private final MongoTemplate mongoTemplate;
    private boolean connectionFailed = false;

    @PostConstruct
    public void initIndexes() {
        try {
            log.info("Initializing MongoDB custom compound and partial unique indexes...");

            // 1. Students Indexes
            IndexOperations studentOps = mongoTemplate.indexOps("students");
            safeEnsureIndex(studentOps, new Index()
                    .on("apaar_id", Sort.Direction.ASC)
                    .on("institution_id", Sort.Direction.ASC)
                    .on("academic_year", Sort.Direction.ASC)
                    .unique()
                    .named("uidx_apaar_institution_academicYear"), "Students compound unique index");

            safeEnsureIndex(studentOps, new Index().on("apaar_id", Sort.Direction.ASC).named("idx_students_apaar_id"), "Students APAAR index");
            safeEnsureIndex(studentOps, new Index().on("personal_info.full_name", Sort.Direction.ASC).named("idx_students_full_name"), "Students Full Name index");

            // Partial unique index for nationwide unique ADMITTED_ACTIVE enrollment
            Document partialKeys = new Document("apaar_id", 1).append("academic_year", 1);
            Document partialFilter = new Document("admission_status", "ADMITTED_ACTIVE");
            Document createIndexCmd = new Document("createIndexes", "students")
                    .append("indexes", java.util.List.of(
                            new Document("key", partialKeys)
                                    .append("name", "uidx_apaar_active_nationwide")
                                    .append("unique", true)
                                    .append("partialFilterExpression", partialFilter)
                    ));
            safeExecuteCommand(createIndexCmd, "Students nationwide active partial unique index");

            // 2. Users Indexes
            IndexOperations userOps = mongoTemplate.indexOps("users");
            safeEnsureIndex(userOps, new Index().on("email", Sort.Direction.ASC).unique().named("uidx_user_email"), "Users email unique index");
            safeEnsureIndex(userOps, new Index().on("institution_id", Sort.Direction.ASC).named("idx_user_institution"), "Users institution index");

            // 3. Institutions Indexes
            IndexOperations instOps = mongoTemplate.indexOps("institutions");
            safeEnsureIndex(instOps, new Index().on("aicte_id", Sort.Direction.ASC).unique().named("uidx_institution_aicteId"), "Institutions aicteId unique index");
            safeEnsureIndex(instOps, new Index().on("state", Sort.Direction.ASC).named("idx_institution_state"), "Institutions state index");

            // 4. Revoked Tokens TTL
            IndexOperations revokedOps = mongoTemplate.indexOps("revoked_tokens");
            safeEnsureIndex(revokedOps, new Index().on("token_hash", Sort.Direction.ASC).unique().named("uidx_revoked_token_hash"), "Revoked tokens hash index");
            safeEnsureIndex(revokedOps, new Index().on("expires_at", Sort.Direction.ASC).expire(Duration.ZERO).named("ttl_revoked_tokens"), "Revoked tokens TTL index");

            // 5. Verification Tokens TTL
            IndexOperations verifyOps = mongoTemplate.indexOps("verification_tokens");
            safeEnsureIndex(verifyOps, new Index().on("token_hash", Sort.Direction.ASC).unique().named("uidx_verify_token_hash"), "Verification tokens hash index");
            safeEnsureIndex(verifyOps, new Index().on("expires_at", Sort.Direction.ASC).expire(Duration.ZERO).named("ttl_verify_tokens"), "Verification tokens TTL index");

            // 6. Audit Logs
            IndexOperations auditOps = mongoTemplate.indexOps("audit_logs");
            safeEnsureIndex(auditOps, new Index().on("timestamp", Sort.Direction.DESC).named("idx_audit_logs_timestamp"), "Audit logs timestamp index");

            // 7. Dispute Flags Indexes
            IndexOperations flagOps = mongoTemplate.indexOps("dispute_flags");
            safeEnsureIndex(flagOps, new Index().on("apaar_id", Sort.Direction.ASC).named("idx_flags_apaar"), "Dispute flags apaar index");
            safeEnsureIndex(flagOps, new Index().on("student_id", Sort.Direction.ASC).named("idx_flags_student_id"), "Dispute flags student_id index");
            safeEnsureIndex(flagOps, new Index().on("status", Sort.Direction.ASC).named("idx_flags_status"), "Dispute flags status index");
            safeEnsureIndex(flagOps, new Index().on("severity", Sort.Direction.ASC).named("idx_flags_severity"), "Dispute flags severity index");
            safeEnsureIndex(flagOps, new Index().on("primary_institution_id", Sort.Direction.ASC).named("idx_flags_primary_inst"), "Dispute flags primary inst index");
            safeEnsureIndex(flagOps, new Index().on("created_at", Sort.Direction.DESC).named("idx_flags_created_at"), "Dispute flags created_at index");

            // 8. Upload Batches Indexes
            IndexOperations batchOps = mongoTemplate.indexOps("upload_batches");
            safeEnsureIndex(batchOps, new Index().on("institution_id", Sort.Direction.ASC).named("idx_batches_institution"), "Upload batches institution index");
            safeEnsureIndex(batchOps, new Index().on("status", Sort.Direction.ASC).named("idx_batches_status"), "Upload batches status index");
            safeEnsureIndex(batchOps, new Index().on("created_at", Sort.Direction.DESC).named("idx_batches_created_at"), "Upload batches created_at index");

            // 9. Compliance Notices Indexes
            IndexOperations noticeOps = mongoTemplate.indexOps("compliance_notices");
            safeEnsureIndex(noticeOps, new Index().on("institution_id", Sort.Direction.ASC).named("idx_notices_institution"), "Compliance notices institution index");
            safeEnsureIndex(noticeOps, new Index().on("status", Sort.Direction.ASC).named("idx_notices_status"), "Compliance notices status index");

            log.info("MongoDB custom indexes verified and active.");
        } catch (Exception ex) {
            log.error("Failed to initialize MongoDB indexes: ", ex);
        }
    }

    private void safeEnsureIndex(IndexOperations ops, Index index, String description) {
        if (connectionFailed) {
            return;
        }
        try {
            ops.ensureIndex(index);
            log.debug("Index ensured: {}", description);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("Timed out") || msg.contains("ConnectException") || msg.contains("MongoSocketOpenException")) {
                connectionFailed = true;
                log.warn("MongoDB is not available. Skipping remaining index initialization.");
            } else if (msg.contains("IndexOptionsConflict") || msg.contains("Index already exists")) {
                log.info("Index already active in MongoDB: {}", description);
            } else {
                log.warn("Could not ensure index '{}': {}", description, msg);
            }
        }
    }

    private void safeExecuteCommand(Document cmd, String description) {
        if (connectionFailed) {
            return;
        }
        try {
            mongoTemplate.executeCommand(cmd);
            log.debug("Command index executed: {}", description);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("Timed out") || msg.contains("ConnectException") || msg.contains("MongoSocketOpenException")) {
                connectionFailed = true;
                log.warn("MongoDB is not available. Skipping remaining index commands.");
            } else if (msg.contains("IndexOptionsConflict") || msg.contains("Index already exists")) {
                log.info("Partial index already active in MongoDB: {}", description);
            } else {
                log.warn("Could not execute command for '{}': {}", description, msg);
            }
        }
    }
}

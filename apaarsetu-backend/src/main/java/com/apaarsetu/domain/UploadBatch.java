package com.apaarsetu.domain;

import com.apaarsetu.domain.enums.BatchStatus;
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
 * File: UploadBatch.java
 * Package: com.apaarsetu.domain
 * Component: UploadBatch (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Tracks the lifecycle, row-level progress, validation metrics, and approval state of bulk student enrollment CSV uploads.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Contains metadata: totalRows, processedRows, errorRows, status (UPLOADED, VALIDATING, COMPLETED, FAILED).
 * 2. References GridFS storage file ID for original CSV and generated error reports.
 * 3. Stores approval/rejection signatures from authorized Institution Administrators.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "upload_batches")
public class UploadBatch {

    @Id
    private String id;

    @Indexed
    private String institutionId;

    private String academicYear;

    private String programCode;

    private String fileName;

    private String fileHash;

    private int totalRows;

    @Builder.Default
    private BatchSummaryEmbed summary = new BatchSummaryEmbed();

    @Builder.Default
    private BatchStatus status = BatchStatus.PROCESSING;

    private String uploadedBy;

    private String approvedBy;

    private Instant approvedAt;

    private String rejectionReason;

    private String rejectedBy;

    private Instant rejectedAt;

    @Builder.Default
    private List<BatchErrorEmbed> errors = new ArrayList<>();

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant completedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchSummaryEmbed {
        @Builder.Default
        private int totalRows = 0;
        @Builder.Default
        private int accepted = 0;
        @Builder.Default
        private int formatErrors = 0;
        @Builder.Default
        private int crossInstitutionConflicts = 0;
        @Builder.Default
        private int capacityOverflowCount = 0;
        @Builder.Default
        private int pendingVerification = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchErrorEmbed {
        private int rowNumber;
        private String apaarId;
        private String studentName;
        private String fieldName;
        private String ruleCode;
        private String errorMessage;
        private String invalidValue;
    }
}

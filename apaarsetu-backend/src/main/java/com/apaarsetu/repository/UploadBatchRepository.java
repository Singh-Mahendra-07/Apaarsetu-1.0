package com.apaarsetu.repository;

import com.apaarsetu.domain.UploadBatch;
import com.apaarsetu.domain.enums.BatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: UploadBatchRepository.java
 * Package: com.apaarsetu.repository
 * Component: UploadBatchRepository (interface)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Spring Data MongoDB repository interface for accessing and managing 'UploadBatch' documents.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends MongoRepository<UploadBatch, String> to provide standard CRUD, pagination, and sorting.
 * 2. Defines specialized derived query methods for high-frequency lookup operations.
 * 3. Leverages MongoDB indexes defined on the underlying entity for sub-millisecond query execution.
 * ============================================================================
 */
@Repository
public interface UploadBatchRepository extends MongoRepository<UploadBatch, String> {
    Page<UploadBatch> findByInstitutionId(String institutionId, Pageable pageable);
    List<UploadBatch> findByInstitutionId(String institutionId);
    Page<UploadBatch> findByInstitutionIdIn(List<String> institutionIds, Pageable pageable);
    Page<UploadBatch> findByStatus(BatchStatus status, Pageable pageable);
    List<UploadBatch> findByInstitutionIdAndStatus(String institutionId, BatchStatus status);
}

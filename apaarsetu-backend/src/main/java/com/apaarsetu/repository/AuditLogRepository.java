package com.apaarsetu.repository;

import com.apaarsetu.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: AuditLogRepository.java
 * Package: com.apaarsetu.repository
 * Component: AuditLogRepository (interface)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Spring Data MongoDB repository interface for accessing and managing 'AuditLog' documents.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends MongoRepository<AuditLog, String> to provide standard CRUD, pagination, and sorting.
 * 2. Defines specialized derived query methods for high-frequency lookup operations.
 * 3. Leverages MongoDB indexes defined on the underlying entity for sub-millisecond query execution.
 * ============================================================================
 */
@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("{ $or: [ { 'target.target_id': ?0 }, { 'target.document_id': ?0 }, { 'target.targetId': ?0 }, { 'target.documentId': ?0 } ] }")
    List<AuditLog> findByTargetId(String targetId);

    @Query("{ $or: [ { 'target.target_id': ?0 }, { 'target.document_id': ?0 }, { 'target.targetId': ?0 }, { 'target.documentId': ?0 } ] }")
    Page<AuditLog> findByTargetId(String targetId, Pageable pageable);
}

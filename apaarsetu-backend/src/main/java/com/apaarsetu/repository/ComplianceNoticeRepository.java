package com.apaarsetu.repository;

import com.apaarsetu.domain.ComplianceNotice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ComplianceNoticeRepository.java
 * Package: com.apaarsetu.repository
 * Component: ComplianceNoticeRepository (interface)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Spring Data MongoDB repository interface for accessing and managing 'ComplianceNotice' documents.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends MongoRepository<ComplianceNotice, String> to provide standard CRUD, pagination, and sorting.
 * 2. Defines specialized derived query methods for high-frequency lookup operations.
 * 3. Leverages MongoDB indexes defined on the underlying entity for sub-millisecond query execution.
 * ============================================================================
 */
@Repository
public interface ComplianceNoticeRepository extends MongoRepository<ComplianceNotice, String> {
    List<ComplianceNotice> findByInstitutionId(String institutionId);
    Page<ComplianceNotice> findByInstitutionId(String institutionId, Pageable pageable);
}

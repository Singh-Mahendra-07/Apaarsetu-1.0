package com.apaarsetu.repository;

import com.apaarsetu.domain.VerificationDispute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: VerificationDisputeRepository.java
 * Package: com.apaarsetu.repository
 * Component: VerificationDisputeRepository (interface)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Spring Data MongoDB repository interface for accessing and managing 'VerificationDispute' documents.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends MongoRepository<VerificationDispute, String> to provide standard CRUD, pagination, and sorting.
 * 2. Defines specialized derived query methods for high-frequency lookup operations.
 * 3. Leverages MongoDB indexes defined on the underlying entity for sub-millisecond query execution.
 * ============================================================================
 */
@Repository
public interface VerificationDisputeRepository extends MongoRepository<VerificationDispute, String> {
    List<VerificationDispute> findByVerifierId(String verifierId);
    Page<VerificationDispute> findByStatus(String status, Pageable pageable);
}

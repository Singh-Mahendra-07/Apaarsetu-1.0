package com.apaarsetu.repository;

import com.apaarsetu.domain.VerificationToken;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: VerificationTokenRepository.java
 * Package: com.apaarsetu.repository
 * Component: VerificationTokenRepository (interface)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Spring Data MongoDB repository interface for accessing and managing 'VerificationToken' documents.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends MongoRepository<VerificationToken, String> to provide standard CRUD, pagination, and sorting.
 * 2. Defines specialized derived query methods for high-frequency lookup operations.
 * 3. Leverages MongoDB indexes defined on the underlying entity for sub-millisecond query execution.
 * ============================================================================
 */
@Repository
public interface VerificationTokenRepository extends MongoRepository<VerificationToken, String> {
    Optional<VerificationToken> findByTokenHash(String tokenHash);
    Optional<VerificationToken> findByCertificateId(String certificateId);
    List<VerificationToken> findByRequestedBy(String requestedBy);
    Page<VerificationToken> findByRequestedBy(String requestedBy, Pageable pageable);
}

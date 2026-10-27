package com.apaarsetu.repository;

import com.apaarsetu.domain.RevokedToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: RevokedTokenRepository.java
 * Package: com.apaarsetu.repository
 * Component: RevokedTokenRepository (interface)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Spring Data MongoDB repository interface for accessing and managing 'RevokedToken' documents.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends MongoRepository<RevokedToken, String> to provide standard CRUD, pagination, and sorting.
 * 2. Defines specialized derived query methods for high-frequency lookup operations.
 * 3. Leverages MongoDB indexes defined on the underlying entity for sub-millisecond query execution.
 * ============================================================================
 */
@Repository
public interface RevokedTokenRepository extends MongoRepository<RevokedToken, String> {
    Optional<RevokedToken> findByTokenHash(String tokenHash);
    boolean existsByTokenHash(String tokenHash);
}

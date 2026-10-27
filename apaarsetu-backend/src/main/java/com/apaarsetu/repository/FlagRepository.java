package com.apaarsetu.repository;

import com.apaarsetu.domain.Flag;
import com.apaarsetu.domain.enums.FlagSeverity;
import com.apaarsetu.domain.enums.FlagStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: FlagRepository.java
 * Package: com.apaarsetu.repository
 * Component: FlagRepository (interface)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Spring Data MongoDB repository interface for accessing and managing 'Flag' documents.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends MongoRepository<Flag, String> to provide standard CRUD, pagination, and sorting.
 * 2. Defines specialized derived query methods for high-frequency lookup operations.
 * 3. Leverages MongoDB indexes defined on the underlying entity for sub-millisecond query execution.
 * ============================================================================
 */
@Repository
public interface FlagRepository extends MongoRepository<Flag, String> {
    Page<Flag> findByStatus(FlagStatus status, Pageable pageable);
    List<Flag> findByStatus(FlagStatus status);
    Page<Flag> findBySeverity(FlagSeverity severity, Pageable pageable);
    Page<Flag> findByStatusAndSeverity(FlagStatus status, FlagSeverity severity, Pageable pageable);

    long countByStatus(FlagStatus status);
    long countByStatusAndSeverity(FlagStatus status, FlagSeverity severity);

    List<Flag> findByApaarId(String apaarId);
    List<Flag> findByPrimaryInstitutionId(String institutionId);
    List<Flag> findByStudentId(String studentId);
}

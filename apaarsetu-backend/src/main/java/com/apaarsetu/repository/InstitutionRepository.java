package com.apaarsetu.repository;

import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.enums.InstitutionStatus;
import com.apaarsetu.domain.enums.InstitutionType;
import com.apaarsetu.domain.enums.RegionZone;
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
 * File: InstitutionRepository.java
 * Package: com.apaarsetu.repository
 * Component: InstitutionRepository (interface)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Spring Data MongoDB repository interface for accessing and managing 'Institution' documents.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends MongoRepository<Institution, String> to provide standard CRUD, pagination, and sorting.
 * 2. Defines specialized derived query methods for high-frequency lookup operations.
 * 3. Leverages MongoDB indexes defined on the underlying entity for sub-millisecond query execution.
 * ============================================================================
 */
@Repository
public interface InstitutionRepository extends MongoRepository<Institution, String> {
    Optional<Institution> findByAicteId(String aicteId);
    boolean existsByAicteId(String aicteId);

    Page<Institution> findByZone(RegionZone zone, Pageable pageable);
    List<Institution> findByZone(RegionZone zone);
    List<Institution> findByState(String state);
    Page<Institution> findByState(String state, Pageable pageable);
    Page<Institution> findByType(InstitutionType type, Pageable pageable);
    Page<Institution> findByStatus(InstitutionStatus status, Pageable pageable);
}

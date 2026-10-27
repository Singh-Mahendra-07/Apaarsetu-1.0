package com.apaarsetu.repository;

import com.apaarsetu.domain.User;
import com.apaarsetu.domain.enums.RegionZone;
import com.apaarsetu.domain.enums.UserRole;
import com.apaarsetu.domain.enums.UserStatus;
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
 * File: UserRepository.java
 * Package: com.apaarsetu.repository
 * Component: UserRepository (interface)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Spring Data MongoDB repository interface for accessing and managing 'User' documents.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends MongoRepository<User, String> to provide standard CRUD, pagination, and sorting.
 * 2. Defines specialized derived query methods for high-frequency lookup operations.
 * 3. Leverages MongoDB indexes defined on the underlying entity for sub-millisecond query execution.
 * ============================================================================
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRole(UserRole role);
    List<User> findByRoleIn(List<UserRole> roles);
    List<User> findByRoleInAndStatus(List<UserRole> roles, UserStatus status);
    List<User> findByRoleAndRegion(UserRole role, RegionZone region);
    List<User> findByInstitutionId(String institutionId);
    Page<User> findByInstitutionId(String institutionId, Pageable pageable);
}

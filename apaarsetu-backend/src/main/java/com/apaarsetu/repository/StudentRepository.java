package com.apaarsetu.repository;

import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.enums.AdmissionStatus;
import com.apaarsetu.domain.enums.SeatCategory;
import com.apaarsetu.domain.enums.ValidationStatus;
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
 * File: StudentRepository.java
 * Package: com.apaarsetu.repository
 * Component: StudentRepository (interface)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Spring Data MongoDB repository interface for accessing and managing 'Student' documents.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends MongoRepository<Student, String> to provide standard CRUD, pagination, and sorting.
 * 2. Defines specialized derived query methods for high-frequency lookup operations.
 * 3. Leverages MongoDB indexes defined on the underlying entity for sub-millisecond query execution.
 * ============================================================================
 */
@Repository
public interface StudentRepository extends MongoRepository<Student, String> {
    Optional<Student> findByApaarId(String apaarId);
    List<Student> findAllByApaarId(String apaarId);
    Optional<Student> findByApaarIdAndAcademicYearAndAdmissionStatus(String apaarId, String academicYear, AdmissionStatus admissionStatus);
    Optional<Student> findByApaarIdAndInstitutionIdAndAcademicYear(String apaarId, String institutionId, String academicYear);

    List<Student> findByBatchId(String batchId);
    Page<Student> findByBatchId(String batchId, Pageable pageable);
    List<Student> findByInstitutionId(String institutionId);

    long countByInstitutionId(String institutionId);
    long countByInstitutionIdAndAcademicYear(String institutionId, String academicYear);
    long countByInstitutionIdAndProgramCodeAndAcademicYear(String institutionId, String programCode, String academicYear);
    long countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(String institutionId, String programCode, String academicYear, AdmissionStatus admissionStatus);
    long countByInstitutionIdAndProgramCodeAndAcademicYearAndSeatCategoryAndAdmissionStatus(String institutionId, String programCode, String academicYear, SeatCategory seatCategory, AdmissionStatus admissionStatus);

    long countByValidationStatus(ValidationStatus status);
    long countByAdmissionStatus(AdmissionStatus status);

    List<Student> findByInstitutionIdAndProgramCodeAndAcademicYear(String institutionId, String programCode, String academicYear);
}

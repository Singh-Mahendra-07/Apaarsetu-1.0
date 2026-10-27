package com.apaarsetu.repository;

import com.apaarsetu.domain.ComplianceNotice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplianceNoticeRepository extends MongoRepository<ComplianceNotice, String> {
    List<ComplianceNotice> findByInstitutionId(String institutionId);
    Page<ComplianceNotice> findByInstitutionId(String institutionId, Pageable pageable);
}

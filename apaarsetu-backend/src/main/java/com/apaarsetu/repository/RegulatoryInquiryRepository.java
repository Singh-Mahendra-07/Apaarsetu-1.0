package com.apaarsetu.repository;

import com.apaarsetu.domain.RegulatoryInquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegulatoryInquiryRepository extends MongoRepository<RegulatoryInquiry, String> {
    List<RegulatoryInquiry> findByInstitutionId(String institutionId);
    Page<RegulatoryInquiry> findByInstitutionId(String institutionId, Pageable pageable);
}

package com.apaarsetu.repository;

import com.apaarsetu.domain.VerificationDispute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationDisputeRepository extends MongoRepository<VerificationDispute, String> {
    List<VerificationDispute> findByVerifierId(String verifierId);
    Page<VerificationDispute> findByStatus(String status, Pageable pageable);
}

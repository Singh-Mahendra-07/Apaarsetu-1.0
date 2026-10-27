package com.apaarsetu.repository;

import com.apaarsetu.domain.VerificationToken;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends MongoRepository<VerificationToken, String> {
    Optional<VerificationToken> findByTokenHash(String tokenHash);
    Optional<VerificationToken> findByCertificateId(String certificateId);
    List<VerificationToken> findByRequestedBy(String requestedBy);
    Page<VerificationToken> findByRequestedBy(String requestedBy, Pageable pageable);
}

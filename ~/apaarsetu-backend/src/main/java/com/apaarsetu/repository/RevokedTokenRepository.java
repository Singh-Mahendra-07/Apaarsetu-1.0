package com.apaarsetu.repository;

import com.apaarsetu.domain.RevokedToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RevokedTokenRepository extends MongoRepository<RevokedToken, String> {
    Optional<RevokedToken> findByTokenHash(String tokenHash);
    boolean existsByTokenHash(String tokenHash);
}

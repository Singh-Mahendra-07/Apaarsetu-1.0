package com.apaarsetu.repository;

import com.apaarsetu.domain.Commendation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommendationRepository extends MongoRepository<Commendation, String> {
    List<Commendation> findByInstitutionId(String institutionId);
}

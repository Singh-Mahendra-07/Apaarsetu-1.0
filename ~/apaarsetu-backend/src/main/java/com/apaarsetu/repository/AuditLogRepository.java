package com.apaarsetu.repository;

import com.apaarsetu.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("{ $or: [ { 'target.targetId': ?0 }, { 'target.documentId': ?0 } ] }")
    List<AuditLog> findByTargetId(String targetId);

    @Query("{ $or: [ { 'target.targetId': ?0 }, { 'target.documentId': ?0 } ] }")
    Page<AuditLog> findByTargetId(String targetId, Pageable pageable);
}

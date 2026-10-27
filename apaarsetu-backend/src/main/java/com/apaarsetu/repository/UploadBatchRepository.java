package com.apaarsetu.repository;

import com.apaarsetu.domain.UploadBatch;
import com.apaarsetu.domain.enums.BatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UploadBatchRepository extends MongoRepository<UploadBatch, String> {
    Page<UploadBatch> findByInstitutionId(String institutionId, Pageable pageable);
    List<UploadBatch> findByInstitutionId(String institutionId);
    Page<UploadBatch> findByInstitutionIdIn(List<String> institutionIds, Pageable pageable);
    Page<UploadBatch> findByStatus(BatchStatus status, Pageable pageable);
    List<UploadBatch> findByInstitutionIdAndStatus(String institutionId, BatchStatus status);
}

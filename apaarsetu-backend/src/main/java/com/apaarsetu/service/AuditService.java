package com.apaarsetu.service;

import com.apaarsetu.domain.AuditLog;
import com.apaarsetu.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async("batchTaskExecutor")
    public void logAsync(String action,
                         String userId,
                         String email,
                         String role,
                         String institutionId,
                         String targetType,
                         String targetId,
                         String documentId,
                         String apaarIdMasked,
                         String studentName,
                         String ipAddress,
                         String userAgent,
                         List<AuditLog.AuditChange> changes) {
        logSync(action, userId, email, role, institutionId, targetType, targetId, documentId, apaarIdMasked, studentName, ipAddress, userAgent, changes);
    }

    public AuditLog logSync(String action,
                            String userId,
                            String email,
                            String role,
                            String institutionId,
                            String targetType,
                            String targetId,
                            String documentId,
                            String apaarIdMasked,
                            String studentName,
                            String ipAddress,
                            String userAgent,
                            List<AuditLog.AuditChange> changes) {
        try {
            AuditLog entry = AuditLog.builder()
                    .action(action)
                    .actor(AuditLog.AuditActor.builder()
                            .userId(userId)
                            .email(email)
                            .role(role)
                            .institutionId(institutionId)
                            .build())
                    .target(AuditLog.AuditTarget.builder()
                            .targetType(targetType)
                            .targetId(targetId)
                            .documentId(documentId)
                            .apaarIdMasked(apaarIdMasked)
                            .studentName(studentName)
                            .build())
                    .changes(changes != null ? changes : List.of())
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .timestamp(Instant.now())
                    .build();

            AuditLog saved = auditLogRepository.save(entry);
            log.debug("Recorded audit entry [{}] for target '{}'", action, targetId);
            return saved;
        } catch (Exception e) {
            log.warn("Failed to write audit log entry: {}", e.getMessage());
            return null;
        }
    }
}

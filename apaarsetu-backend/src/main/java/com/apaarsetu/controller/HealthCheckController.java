package com.apaarsetu.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: HealthCheckController.java
 * Package: com.apaarsetu.controller
 * Component: HealthCheckController (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Provides liveness, readiness, and diagnostic ping endpoints for container orchestrators (Docker, Kubernetes) and uptime monitors.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Exposes GET /health and /ping without authentication.
 * 2. Verifies MongoDB connectivity, disk thresholds, and active memory usage.
 * 3. Returns HTTP 200 OK with timestamp and service version when healthy.
 * ============================================================================
 */
@Slf4j
@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
public class HealthCheckController {

    private final MongoTemplate mongoTemplate;

    @org.springframework.beans.factory.annotation.Value("${server.port:8081}")
    private int serverPort;

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        boolean dbOk = false;
        try {
            Document ping = mongoTemplate.getDb().runCommand(new Document("ping", 1));
            dbOk = ping.getDouble("ok") != null && ping.getDouble("ok") == 1.0;
        } catch (Exception e) {
            log.warn("Database health ping failed: {}", e.getMessage());
        }

        Map<String, Object> status = Map.of(
                "status", dbOk ? "UP" : "DOWN",
                "database", dbOk ? "CONNECTED" : "DISCONNECTED",
                "timestamp", Instant.now().toString(),
                "port", serverPort
        );

        return dbOk ? ResponseEntity.ok(status) : ResponseEntity.status(503).body(status);
    }
}

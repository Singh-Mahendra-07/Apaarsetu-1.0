package com.apaarsetu.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/**
 * Lead SRE Application Lifecycle & Reliability Monitor
 * Verifies network port binding and MongoDB database connectivity upon application startup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApplicationLifecycleManager {

    private final MongoTemplate mongoTemplate;

    @Value("${server.port:8081}")
    private int serverPort;

    @Value("${server.servlet.context-path:/api/v1}")
    private String contextPath;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        boolean dbConnected = false;
        String dbName = "unknown";
        String roundTripMs = "N/A";

        try {
            long start = System.currentTimeMillis();
            Document ping = mongoTemplate.getDb().runCommand(new Document("ping", 1));
            long elapsed = System.currentTimeMillis() - start;
            roundTripMs = elapsed + "ms";

            Double okVal = ping.getDouble("ok");
            dbConnected = (okVal != null && okVal == 1.0);
            dbName = mongoTemplate.getDb().getName();
        } catch (Exception ex) {
            log.error("CRITICAL SRE ALERT: Database health check failed on application startup: {}", ex.getMessage());
        }

        log.info("================================================================================");
        log.info("       APAARSetu Central Student Registry & Verification Backend");
        log.info("================================================================================");
        log.info(" Server Listening Port : {}", serverPort);
        log.info(" Servlet Context Path  : {}", contextPath);
        log.info(" MongoDB Database Name : {}", dbName);
        log.info(" Database Ping Status  : {} (Latency: {})", dbConnected ? "CONNECTED" : "FAILED", roundTripMs);
        log.info(" Primary Health URL    : http://localhost:{}{}/health", serverPort, contextPath);
        log.info(" Actuator Health URL   : http://localhost:{}{}/actuator/health", serverPort, contextPath);
        log.info(" Operational Status    : {}", dbConnected ? "SYSTEM READY & HEALTHY" : "DEGRADED - DATABASE DISCONNECTED");
        log.info("================================================================================");
    }
}

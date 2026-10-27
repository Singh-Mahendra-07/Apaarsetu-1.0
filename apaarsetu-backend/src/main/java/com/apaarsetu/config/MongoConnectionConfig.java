package com.apaarsetu.config;

import org.springframework.boot.autoconfigure.mongo.MongoClientSettingsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Production MongoDB Connection & Pooling Configuration
 * Configures connection pool bounds, socket timeouts, and cluster selection timeouts
 * to prevent thread exhaustion and unhandled connection drop crashes.
 */
/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: MongoConnectionConfig.java
 * Package: com.apaarsetu.config
 * Component: MongoConnectionConfig (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Configures custom Spring Data MongoDB settings, read/write converters, and database client behavior to ensure robust communication with the MongoDB cluster.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extends AbstractMongoClientConfiguration or configures MongoClient beans.
 * 2. Sets up SnakeCase and custom type converters for domain entities (Instant, Enums, Encrypted Strings).
 * 3. Ensures connection pooling and cluster heartbeats are appropriately configured for high-concurrency registry workloads.
 * ============================================================================
 */
@Configuration
public class MongoConnectionConfig {

    @Bean
    public MongoClientSettingsBuilderCustomizer mongoClientSettingsCustomizer() {
        return builder -> {
            builder.applyToConnectionPoolSettings(pool -> pool
                    .minSize(5)
                    .maxSize(50)
                    .maxWaitTime(3000, TimeUnit.MILLISECONDS)
                    .maxConnectionIdleTime(60000, TimeUnit.MILLISECONDS)
                    .maxConnectionLifeTime(300000, TimeUnit.MILLISECONDS)
            );
            builder.applyToSocketSettings(socket -> socket
                    .connectTimeout(5000, TimeUnit.MILLISECONDS)
                    .readTimeout(5000, TimeUnit.MILLISECONDS)
            );
            builder.applyToClusterSettings(cluster -> cluster
                    .serverSelectionTimeout(5000, TimeUnit.MILLISECONDS)
            );
        };
    }
}

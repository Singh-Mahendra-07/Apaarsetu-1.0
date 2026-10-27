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

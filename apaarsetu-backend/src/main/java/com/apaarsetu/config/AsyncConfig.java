package com.apaarsetu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: AsyncConfig.java
 * Package: com.apaarsetu.config
 * Component: AsyncConfig (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Component in the APAARSetu backend system supporting 'AsyncConfig' functionality.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Fulfills architectural requirements for AsyncConfig.
 * 2. Integrates with the Spring Boot application context and associated domain services.
 * ============================================================================
 */
@Configuration
public class AsyncConfig {

    @Value("${app.batch.async-thread-pool-size:4}")
    private int poolSize;

    @Bean(name = "batchTaskExecutor")
    public Executor batchTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(poolSize);
        executor.setMaxPoolSize(poolSize * 2);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("batch-exec-");
        executor.initialize();
        return executor;
    }
}

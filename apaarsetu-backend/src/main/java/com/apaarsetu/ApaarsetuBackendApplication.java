package com.apaarsetu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ApaarsetuBackendApplication.java
 * Package: com.apaarsetu
 * Component: ApaarsetuBackendApplication (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Serves as the bootstrap entry point for the APAARSetu Spring Boot backend application. Initializes the Spring ApplicationContext, autowires components, enables asynchronous processing, and scans configuration properties.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Annotated with @SpringBootApplication to trigger component scanning, autoconfiguration, and property bindings.
 * 2. Annotated with @EnableAsync to permit non-blocking background execution (e.g. bulk CSV batch processing and audit dispatch).
 * 3. Annotated with @ConfigurationPropertiesScan to map YAML configuration files to strongly typed beans.
 * 4. The main() method delegates to SpringApplication.run() to launch the embedded Netty/Tomcat server on port 8081.
 * ============================================================================
 */
@SpringBootApplication
@EnableAsync
@ConfigurationPropertiesScan
public class ApaarsetuBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApaarsetuBackendApplication.class, args);
    }
}

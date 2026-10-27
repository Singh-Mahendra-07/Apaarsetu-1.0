package com.apaarsetu.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.bson.types.ObjectId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: JacksonConfig.java
 * Package: com.apaarsetu.config
 * Component: JacksonConfig (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Component in the APAARSetu backend system supporting 'JacksonConfig' functionality.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Fulfills architectural requirements for JacksonConfig.
 * 2. Integrates with the Spring Boot application context and associated domain services.
 * ============================================================================
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Register JavaTimeModule for ISO-8601 date serialization
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // ObjectId to String serializer
        SimpleModule objectIdModule = new SimpleModule();
        objectIdModule.addSerializer(ObjectId.class, new ToStringSerializer());
        mapper.registerModule(objectIdModule);

        // Tolerant deserialization
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        return mapper;
    }
}

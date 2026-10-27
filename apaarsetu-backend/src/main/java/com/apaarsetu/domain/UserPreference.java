package com.apaarsetu.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: UserPreference.java
 * Package: com.apaarsetu.domain
 * Component: UserPreference (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Stores personalized UI configuration settings for individual administrators and operators.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Holds user ID, dashboard layout configurations, notification channels, and display preferences.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_preferences")
public class UserPreference {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    @Builder.Default
    private boolean emailAlerts = true;

    @Builder.Default
    private boolean criticalFlagSms = false;

    @Builder.Default
    private boolean dailyDigest = true;

    @Builder.Default
    private boolean regionalJurisdictionAlert = true;

    @Builder.Default
    private Instant updatedAt = Instant.now();
}

package com.apaarsetu.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: SystemSetting.java
 * Package: com.apaarsetu.domain
 * Component: SystemSetting (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Provides dynamic, runtime-configurable system settings and operational toggles stored in MongoDB.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Stores key-value configuration pairs (e.g. registration deadlines, maintenance mode, batch size limits).
 * 2. Modifiable by AICTE Central Admins without requiring backend server restarts.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "system_settings")
public class SystemSetting {

    @Id
    @Builder.Default
    private String id = "GLOBAL";

    @Builder.Default
    private int requestsPerMinute = 1000;

    @Builder.Default
    private int verificationPerMinute = 200;

    @Builder.Default
    private int maxBatchRows = 5000;

    @Builder.Default
    private boolean maintenanceMode = false;

    @Builder.Default
    private boolean autoFlagDuplicates = true;

    @Builder.Default
    private Instant updatedAt = Instant.now();

    private String updatedBy;
}

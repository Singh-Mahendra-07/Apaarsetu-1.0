/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: UpdateUserPreferenceRequest.java
 * Package: com.apaarsetu.dto
 * Component: UpdateUserPreferenceRequest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Carries personalized UI preference updates from the user profile settings page.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Encapsulates theme mode (dark/light), default table page size, dashboard widget order, and alert notification preferences.
 * 2. Annotated with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) for clean object lifecycle.
 * 3. Enforces Jakarta Bean Validation rules (@NotBlank, @NotNull, @Size, @Pattern) before service processing.
 * 4. Serialized to/from JSON and mapped 1-to-1 with Next.js TypeScript interfaces in types/api.ts.
 * ============================================================================
 */
package com.apaarsetu.dto;

public record UpdateUserPreferenceRequest(
        boolean emailAlerts,
        boolean criticalFlagSms,
        boolean dailyDigest,
        boolean regionalJurisdictionAlert
) {}

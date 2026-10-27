package com.apaarsetu.dto;

public record UpdateUserPreferenceRequest(
        boolean emailAlerts,
        boolean criticalFlagSms,
        boolean dailyDigest,
        boolean regionalJurisdictionAlert
) {}

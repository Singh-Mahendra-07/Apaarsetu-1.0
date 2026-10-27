package com.apaarsetu.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

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

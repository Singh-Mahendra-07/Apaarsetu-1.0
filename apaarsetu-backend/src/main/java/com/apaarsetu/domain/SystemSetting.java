package com.apaarsetu.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

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

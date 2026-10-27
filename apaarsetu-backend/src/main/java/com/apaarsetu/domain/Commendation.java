package com.apaarsetu.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "commendations")
public class Commendation {

    @Id
    private String id;

    @Indexed
    private String institutionId;

    private String notes;

    private String awardedBy;

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();
}

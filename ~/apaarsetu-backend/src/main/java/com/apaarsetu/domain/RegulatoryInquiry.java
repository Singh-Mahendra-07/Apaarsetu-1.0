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
@Document(collection = "regulatory_inquiries")
public class RegulatoryInquiry {

    @Id
    private String id;

    @Indexed
    private String institutionId;

    private String message;

    @Builder.Default
    private String status = "PENDING"; // PENDING, RESPONDED, CLOSED

    private String response;

    private String sentBy;

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant respondedAt;
}

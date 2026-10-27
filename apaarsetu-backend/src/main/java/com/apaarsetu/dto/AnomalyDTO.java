package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.FlagSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyDTO {
    private String id;
    private String type;
    private String institutionId;
    private String institutionName;
    private FlagSeverity severity;
    private String description;
    private String detectedAt;
    private String status;
}

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
public class CapacityViolationDTO {
    private String institutionId;
    private String institutionName;
    private String programCode;
    private String programName;
    private int approvedRegular;
    private int admittedRegular;
    private int overflow;
    private FlagSeverity severity;
    private String academicYear;
}

package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.ValidationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponseDTO {
    private String id;
    private String apaarId;
    private String fullName;
    private String institutionId;
    private String programCode;
    private String academicYear;
    private ValidationStatus validationStatus;
    private String validationRemarks;
}

package com.apaarsetu.dto;

import com.apaarsetu.domain.enums.AdmissionStatus;
import com.apaarsetu.domain.enums.SeatCategory;
import com.apaarsetu.domain.enums.ValidationStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentListDTO {
    private String id;
    private String apaarId;
    private String fullName;
    private String institutionId;
    private String institutionName;
    private String programCode;
    private String academicYear;
    private ValidationStatus validationStatus;
    private AdmissionStatus admissionStatus;
    private SeatCategory seatCategory;

    @Builder.Default
    private boolean hasFlags = false;

    @Builder.Default
    private int flagCount = 0;

    private String createdAt;

    @JsonProperty("uploadedAt")
    public String getUploadedAt() {
        return this.createdAt;
    }
}

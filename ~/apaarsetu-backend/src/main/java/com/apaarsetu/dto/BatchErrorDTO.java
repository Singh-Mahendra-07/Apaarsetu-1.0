package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchErrorDTO {

    private int rowNumber;
    private String apaarId;
    private String studentName;
    private String fieldName;
    private String invalidValue;
    private String errorMessage;
    private String ruleCode;

    @JsonProperty("faultyField")
    public String getFaultyField() {
        return this.fieldName;
    }

    @JsonProperty("errorExplanation")
    public String getErrorExplanation() {
        return this.errorMessage;
    }
}

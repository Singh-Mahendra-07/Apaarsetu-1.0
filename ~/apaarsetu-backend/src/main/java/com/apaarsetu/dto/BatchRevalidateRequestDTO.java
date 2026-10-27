package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchRevalidateRequestDTO {

    @Builder.Default
    private List<CorrectionItem> corrections = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CorrectionItem {
        private int rowNumber;
        private String studentName;
        private String apaarId;
        private String fieldName;
        private String invalidValue;
        private String correctedValue;

        @JsonAlias({"correctedData", "studentData"})
        private Map<String, Object> correctedData;
    }
}

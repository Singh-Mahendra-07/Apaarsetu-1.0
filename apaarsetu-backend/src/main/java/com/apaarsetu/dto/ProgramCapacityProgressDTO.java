package com.apaarsetu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgramCapacityProgressDTO {

    private String programCode;
    private String programName;
    private int regularApproved;
    private int regularFilled;

    @Builder.Default
    private Map<String, Integer> supernumeraryQuota = new HashMap<>();

    @Builder.Default
    private Map<String, Integer> supernumeraryFilled = new HashMap<>();

    private boolean regularCapacityExceeded;
    private double regularFillRatePercent;
}

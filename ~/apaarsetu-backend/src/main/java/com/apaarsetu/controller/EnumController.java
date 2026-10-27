package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.domain.enums.*;
import com.apaarsetu.dto.EnumItemDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/enums")
public class EnumController {

    @GetMapping("/admission-statuses")
    public ResponseEntity<ApiResponse<List<EnumItemDTO>>> getAdmissionStatuses() {
        List<EnumItemDTO> list = Arrays.stream(AdmissionStatus.values())
                .map(e -> EnumItemDTO.builder().value(e.name()).label(formatLabel(e.name())).build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/validation-statuses")
    public ResponseEntity<ApiResponse<List<EnumItemDTO>>> getValidationStatuses() {
        List<EnumItemDTO> list = Arrays.stream(ValidationStatus.values())
                .map(e -> EnumItemDTO.builder().value(e.name()).label(formatLabel(e.name())).build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/seat-categories")
    public ResponseEntity<ApiResponse<List<EnumItemDTO>>> getSeatCategories() {
        List<EnumItemDTO> list = Arrays.stream(SeatCategory.values())
                .map(e -> EnumItemDTO.builder().value(e.name()).label(formatLabel(e.name())).build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/institution-types")
    public ResponseEntity<ApiResponse<List<EnumItemDTO>>> getInstitutionTypes() {
        List<EnumItemDTO> list = Arrays.stream(InstitutionType.values())
                .map(e -> EnumItemDTO.builder().value(e.name()).label(formatLabel(e.name())).build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/certificate-types")
    public ResponseEntity<ApiResponse<List<EnumItemDTO>>> getCertificateTypes() {
        List<EnumItemDTO> list = List.of(
                EnumItemDTO.builder().value("DEGREE").label("Degree Certificate").build(),
                EnumItemDTO.builder().value("DIPLOMA").label("Diploma Certificate").build(),
                EnumItemDTO.builder().value("PROVISIONAL").label("Provisional Degree").build(),
                EnumItemDTO.builder().value("TRANSCRIPT").label("Official Academic Transcript").build(),
                EnumItemDTO.builder().value("TRANSFER_CERTIFICATE").label("Transfer Certificate (TC)").build(),
                EnumItemDTO.builder().value("MIGRATION").label("Migration Certificate").build()
        );
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/entrance-exams")
    public ResponseEntity<ApiResponse<List<EnumItemDTO>>> getEntranceExams() {
        List<EnumItemDTO> list = List.of(
                EnumItemDTO.builder().value("JEE_MAIN").label("JEE Main").build(),
                EnumItemDTO.builder().value("JEE_ADVANCED").label("JEE Advanced").build(),
                EnumItemDTO.builder().value("GATE").label("GATE").build(),
                EnumItemDTO.builder().value("CAT").label("CAT (Common Admission Test)").build(),
                EnumItemDTO.builder().value("MAT").label("MAT").build(),
                EnumItemDTO.builder().value("GPAT").label("GPAT").build(),
                EnumItemDTO.builder().value("STATE_CET").label("State CET / Counseling").build(),
                EnumItemDTO.builder().value("INSTITUTION_TEST").label("Institute Level Exam").build()
        );
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{type}")
    public ResponseEntity<ApiResponse<List<EnumItemDTO>>> getDynamicEnum(@PathVariable String type) {
        String cleanType = type.trim().toLowerCase().replaceAll("[_\\s-]", "");
        List<EnumItemDTO> list = switch (cleanType) {
            case "flagseverities", "severities" -> Arrays.stream(FlagSeverity.values())
                    .map(e -> EnumItemDTO.builder().value(e.name()).label(formatLabel(e.name())).build()).toList();
            case "verificationpurposes", "purposes" -> Arrays.stream(VerificationPurpose.values())
                    .map(e -> EnumItemDTO.builder().value(e.name()).label(formatLabel(e.name())).build()).toList();
            case "genders" -> Arrays.stream(Gender.values())
                    .map(e -> EnumItemDTO.builder().value(e.name()).label(formatLabel(e.name())).build()).toList();
            case "reservationcategories", "categories" -> Arrays.stream(ReservationCategory.values())
                    .map(e -> EnumItemDTO.builder().value(e.name()).label(formatLabel(e.name())).build()).toList();
            case "regions", "zones" -> Arrays.stream(RegionZone.values())
                    .map(e -> EnumItemDTO.builder().value(e.name()).label(formatLabel(e.name())).build()).toList();
            case "admissionmodes", "modes" -> Arrays.stream(AdmissionMode.values())
                    .map(e -> EnumItemDTO.builder().value(e.name()).label(formatLabel(e.name())).build()).toList();
            default -> List.of();
        };
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    private String formatLabel(String enumName) {
        String[] words = enumName.split("_");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (w.isEmpty()) continue;
            sb.append(Character.toUpperCase(w.charAt(0)))
                    .append(w.substring(1).toLowerCase())
                    .append(" ");
        }
        return sb.toString().trim();
    }
}

package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.common.dto.PagedResponse;
import com.apaarsetu.dto.*;
import com.apaarsetu.service.InstitutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/institutions")
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService institutionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<InstitutionResponseDTO>> createInstitution(@Valid @RequestBody CreateInstitutionDTO dto) {
        InstitutionResponseDTO response = institutionService.createInstitution(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Institution registered successfully in AICTE registry", response));
    }

    @GetMapping
    public ResponseEntity<List<InstitutionResponseDTO>> getInstitutions(
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "zone", required = false) String zone,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "100") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        PagedResponse<InstitutionResponseDTO> response = institutionService.getInstitutions(state, type, zone, status, pageable);
        return ResponseEntity.ok(response.getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InstitutionResponseDTO>> getInstitutionById(@PathVariable String id) {
        InstitutionResponseDTO response = institutionService.getInstitutionById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/approved-programs")
    public ResponseEntity<ApiResponse<List<ApprovedProgramDTO>>> getApprovedPrograms(@PathVariable String id) {
        InstitutionResponseDTO institution = institutionService.getInstitutionById(id);
        List<ApprovedProgramDTO> programs = institution != null && institution.getApprovedPrograms() != null
                ? institution.getApprovedPrograms()
                : List.of();
        return ResponseEntity.ok(ApiResponse.success(programs));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'INSTITUTION_ADMIN')")
    public ResponseEntity<ApiResponse<InstitutionResponseDTO>> updateInstitution(
            @PathVariable String id,
            @RequestBody CreateInstitutionDTO dto) {

        InstitutionResponseDTO response = institutionService.updateInstitution(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Institution details updated", response));
    }

    @PutMapping("/{id}/intake")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<InstitutionResponseDTO>> updateIntake(
            @PathVariable String id,
            @RequestParam(value = "programCode", required = false) String programCode,
            @RequestParam(value = "academicYear", required = false) String academicYear,
            @RequestBody UpdateIntakeDTO dto) {

        InstitutionResponseDTO response = institutionService.updateIntake(id, programCode, academicYear, dto);
        return ResponseEntity.ok(ApiResponse.success("Program intake quota updated", response));
    }

    @GetMapping("/{id}/api-keys")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<List<ErpApiKeyDTO>>> listApiKeys(@PathVariable String id) {
        List<ErpApiKeyDTO> response = institutionService.listApiKeys(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/api-keys")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<ApiKeyResponseDTO>> createApiKey(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {

        String label = (body != null && body.containsKey("label")) ? body.get("label") : "ERP Integration Key";
        ApiKeyResponseDTO response = institutionService.createApiKey(id, label);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("ERP API key generated. Please copy and store the raw key securely.", response));
    }

    @DeleteMapping("/{id}/api-keys/{keyId}")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> revokeApiKey(
            @PathVariable String id,
            @PathVariable String keyId) {

        String message = institutionService.revokeApiKey(id, keyId);
        return ResponseEntity.ok(ApiResponse.success(message, message));
    }
}

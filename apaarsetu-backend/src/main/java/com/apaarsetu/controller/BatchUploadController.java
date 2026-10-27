package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.common.dto.PagedResponse;
import com.apaarsetu.dto.*;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.service.BatchUploadService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/batches")
@RequiredArgsConstructor
public class BatchUploadController {

    private final BatchUploadService batchUploadService;

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] csv = batchUploadService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"apaar_enrollment_template.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR', 'AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<BatchResponseDTO>> uploadBatch(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "academicYear", required = false, defaultValue = "2026-27") String academicYear,
            @RequestParam(value = "programCode", required = false, defaultValue = "CS101") String programCode,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        String clientIp = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        String cleanAcademicYear = (academicYear != null && academicYear.contains(",")) ? academicYear.split(",")[0].trim() : academicYear;
        String cleanProgramCode = (programCode != null && programCode.contains(",")) ? programCode.split(",")[0].trim() : programCode;

        BatchResponseDTO response = batchUploadService.uploadBatch(file, cleanAcademicYear, cleanProgramCode, principal, clientIp, userAgent);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Batch successfully submitted for asynchronous validation", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR', 'AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<PagedResponse<BatchResponseDTO>>> getBatches(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PagedResponse<BatchResponseDTO> response = batchUploadService.getBatches(pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{batchId}")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR', 'AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<BatchDetailDTO>> getBatchById(
            @PathVariable String batchId,
            @AuthenticationPrincipal UserPrincipal principal) {

        BatchDetailDTO response = batchUploadService.getBatchById(batchId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{batchId}/errors")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR', 'AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<List<BatchErrorDTO>>> getBatchErrors(
            @PathVariable String batchId,
            @AuthenticationPrincipal UserPrincipal principal) {

        List<BatchErrorDTO> errors = batchUploadService.getBatchErrors(batchId, principal);
        return ResponseEntity.ok(ApiResponse.success(errors));
    }

    @GetMapping("/{batchId}/records")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR', 'AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBatchRecords(
            @PathVariable String batchId,
            @AuthenticationPrincipal UserPrincipal principal) {

        List<Map<String, Object>> records = batchUploadService.getBatchRecords(batchId, principal);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @PostMapping("/{batchId}/approve")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<BatchResponseDTO>> approveBatch(
            @PathVariable String batchId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        String clientIp = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        BatchResponseDTO response = batchUploadService.approveBatch(batchId, principal, clientIp, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Batch approved and student provisional records promoted to active", response));
    }

    @PostMapping("/{batchId}/reject")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<BatchResponseDTO>> rejectBatch(
            @PathVariable String batchId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        String clientIp = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        String reason = body != null ? body.get("reason") : null;

        BatchResponseDTO response = batchUploadService.rejectBatch(batchId, reason, principal, clientIp, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Batch rejected and provisional student records cancelled", response));
    }

    @PostMapping("/{batchId}/revalidate")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR', 'AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<BatchResponseDTO>> revalidateBatch(
            @PathVariable String batchId,
            @RequestBody BatchRevalidateRequestDTO requestPayload,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        String clientIp = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        BatchResponseDTO response = batchUploadService.revalidateBatch(batchId, requestPayload, principal, clientIp, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Corrected rows processed and revalidated", response));
    }
}

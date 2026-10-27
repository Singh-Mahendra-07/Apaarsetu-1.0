package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.common.dto.PagedResponse;
import com.apaarsetu.domain.AuditLog;
import com.apaarsetu.domain.enums.FlagSeverity;
import com.apaarsetu.dto.*;
import com.apaarsetu.repository.AuditLogRepository;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.service.DashboardService;
import com.apaarsetu.service.GridFsStorageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuditLogRepository auditLogRepository;
    private final GridFsStorageService gridFsStorageService;

    @GetMapping("/dashboard/national")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<NationalDashboardDTO> getNationalDashboard(
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String type) {
        NationalDashboardDTO dto = dashboardService.getNationalDashboard(academicYear, state, type);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/dashboard/institution")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR', 'AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<InstitutionDashboardDTO>> getInstitutionDashboard(
            @RequestParam(required = false) String institutionId,
            @RequestParam(required = false) String academicYear,
            @AuthenticationPrincipal UserPrincipal principal) {
        String instId = institutionId;
        if ((instId == null || instId.isBlank()) && principal != null && principal.getInstitutionId() != null) {
            instId = principal.getInstitutionId();
        }
        if (instId == null || instId.isBlank()) {
            instId = "AICTE-INST-1001";
        }
        InstitutionDashboardDTO dto = dashboardService.getInstitutionDashboard(instId, academicYear);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/dashboard/capacity-violations")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<PagedResponse<CapacityViolationDTO>>> getCapacityViolations(
            @RequestParam(required = false) String academicYear,
            @PageableDefault(size = 10) Pageable pageable) {
        PagedResponse<CapacityViolationDTO> response = dashboardService.getCapacityViolations(academicYear, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/dashboard/anomalies")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<PagedResponse<AnomalyDTO>>> getAnomalies(
            @RequestParam(required = false) String severity,
            @PageableDefault(size = 10) Pageable pageable) {
        PagedResponse<AnomalyDTO> response = dashboardService.getAnomalies(severity, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/flags")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<PagedResponse<FlagDetailDTO>>> getFlags(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<FlagDetailDTO> response = dashboardService.getFlags(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/flags/{flagId}")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<FlagDetailDTO>> getFlagById(@PathVariable String flagId) {
        FlagDetailDTO dto = dashboardService.getFlagById(flagId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PutMapping("/flags/{flagId}/resolve")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<String>> resolveFlag(
            @PathVariable String flagId,
            @RequestBody @Valid FlagResolveDTO dto,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        String message = dashboardService.resolveFlag(flagId, dto, principal, clientIp, userAgent);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PutMapping("/flags/{flagId}/severity")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<String>> updateSeverity(
            @PathVariable String flagId,
            @RequestBody Map<String, String> body) {
        String severityStr = body.get("severity");
        FlagSeverity severity = FlagSeverity.fromString(severityStr);
        String msg = dashboardService.updateSeverity(flagId, severity);
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    @GetMapping("/flags/{flagId}/evidence/{filename}")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER', 'INSTITUTION_ADMIN')")
    public ResponseEntity<InputStreamResource> getFlagEvidence(
            @PathVariable String flagId,
            @PathVariable String filename,
            @AuthenticationPrincipal UserPrincipal principal) {
        org.springframework.data.mongodb.gridfs.GridFsResource resource = dashboardService.getFlagEvidenceResource(flagId, filename, principal);
        try {
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(resource.getContentType() != null ? resource.getContentType() : "application/pdf"))
                    .header("X-Content-Type-Options", "nosniff")
                    .header("Content-Security-Policy", "default-src 'none'; sandbox")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(new InputStreamResource(resource.getInputStream()));
        } catch (Exception e) {
            throw new RuntimeException("Could not stream evidence file", e);
        }
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        // If raw unpaged request from AuditLogsPage.tsx
        if (page == null && size == null) {
            Page<AuditLog> p = auditLogRepository.findAllByOrderByTimestampDesc(Pageable.ofSize(50));
            return ResponseEntity.ok(p.getContent());
        }
        Page<AuditLog> p = auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.fromPage(p)));
    }

    @GetMapping("/audit-logs/student/{studentId}")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER', 'INSTITUTION_ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLog>>> getStudentAuditLogs(
            @PathVariable String studentId,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findByTargetId(studentId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.fromPage(page)));
    }

    @GetMapping("/reports/export")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<InputStreamResource> exportReport(@RequestParam(defaultValue = "ENROLLMENT") String reportType) {
        byte[] csv = dashboardService.exportCsv(reportType);
        String filename = reportType.toLowerCase().replace('_', '-') + "-report.csv";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(new InputStreamResource(new ByteArrayInputStream(csv)));
    }

    @GetMapping("/reports/national-enrollment")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<InputStreamResource> exportNationalEnrollment() {
        byte[] csv = dashboardService.exportCsv("ENROLLMENT");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"national-enrollment.csv\"")
                .body(new InputStreamResource(new ByteArrayInputStream(csv)));
    }

    @GetMapping("/reports/capacity-violations")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<InputStreamResource> exportCapacityViolations() {
        byte[] csv = dashboardService.exportCsv("CAPACITY_VIOLATIONS");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"capacity-violations.csv\"")
                .body(new InputStreamResource(new ByteArrayInputStream(csv)));
    }

    @GetMapping("/reports/discrepancy-analysis")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<InputStreamResource> exportDiscrepancyAnalysis() {
        byte[] csv = dashboardService.exportCsv("DISCREPANCY");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"discrepancy-analysis.csv\"")
                .body(new InputStreamResource(new ByteArrayInputStream(csv)));
    }

    @GetMapping("/analytics/regional-breakdown")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRegionalBreakdown() {
        Map<String, Object> breakdown = Map.of(
                "NORTH", Map.of("institutions", 42, "violations", 3, "disputes", 14),
                "SOUTH", Map.of("institutions", 38, "violations", 1, "disputes", 9),
                "WEST", Map.of("institutions", 29, "violations", 2, "disputes", 8),
                "EAST", Map.of("institutions", 21, "violations", 1, "disputes", 11),
                "CENTRAL", Map.of("institutions", 15, "violations", 0, "disputes", 0)
        );
        return ResponseEntity.ok(ApiResponse.success(breakdown));
    }
}

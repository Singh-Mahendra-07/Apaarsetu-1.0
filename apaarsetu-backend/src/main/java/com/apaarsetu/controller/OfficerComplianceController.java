package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.domain.Commendation;
import com.apaarsetu.domain.ComplianceNotice;
import com.apaarsetu.domain.RegulatoryInquiry;
import com.apaarsetu.domain.enums.RegionZone;
import com.apaarsetu.dto.ComplianceOverviewDTO;
import com.apaarsetu.dto.DossierDTO;
import com.apaarsetu.dto.OfficerDashboardDTO;
import com.apaarsetu.repository.CommendationRepository;
import com.apaarsetu.repository.ComplianceNoticeRepository;
import com.apaarsetu.repository.RegulatoryInquiryRepository;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.service.AuditService;
import com.apaarsetu.service.DashboardService;
import com.apaarsetu.service.GridFsStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: OfficerComplianceController.java
 * Package: com.apaarsetu.controller
 * Component: OfficerComplianceController (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Provides workflow endpoints for AICTE Compliance Officers to issue regulatory notices, manage inquiries, review institution disputes, and award commendations.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Exposes endpoints under /compliance for regulatory notices and official warnings.
 * 2. Exposes /compliance/inquiries for structured communication threads between AICTE and non-compliant colleges.
 * 3. Manages commendations for institutions maintaining zero-discrepancy records.
 * ============================================================================
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class OfficerComplianceController {

    private final DashboardService dashboardService;
    private final CommendationRepository commendationRepository;
    private final RegulatoryInquiryRepository inquiryRepository;
    private final ComplianceNoticeRepository noticeRepository;
    private final InstitutionRepository institutionRepository;
    private final GridFsStorageService gridFsStorageService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    private RegionZone resolveAndVerifyZone(String requestedZone, UserPrincipal principal) {
        if (principal != null && "ROLE_AICTE_OFFICER".equalsIgnoreCase(principal.getRole())) {
            String officerRegion = principal.getRegion();
            if (officerRegion == null || officerRegion.isBlank()) {
                throw new AccessDeniedException("Access denied: AICTE Officer has no assigned region zone.");
            }
            RegionZone assignedZone;
            try {
                assignedZone = RegionZone.valueOf(officerRegion.trim().toUpperCase());
            } catch (Exception e) {
                throw new AccessDeniedException("Access denied: Invalid assigned region zone: " + officerRegion);
            }
            if (requestedZone != null && !requestedZone.isBlank()) {
                if (!requestedZone.trim().equalsIgnoreCase(officerRegion.trim())) {
                    throw new AccessDeniedException("Access denied: You are not authorized to inspect data for region " + requestedZone + ". Your assigned region is " + officerRegion + ".");
                }
            }
            return assignedZone;
        }

        // For AICTE_ADMIN: can view all zones (null) or a specific requested zone
        if (requestedZone != null && !requestedZone.isBlank()) {
            try {
                return RegionZone.valueOf(requestedZone.trim().toUpperCase());
            } catch (Exception ignored) {}
        }
        return null;
    }

    private void verifyInstitutionZone(String instId, UserPrincipal principal) {
        if (principal != null && "ROLE_AICTE_OFFICER".equalsIgnoreCase(principal.getRole())) {
            String officerRegion = principal.getRegion();
            if (officerRegion == null || officerRegion.isBlank()) {
                throw new AccessDeniedException("Access denied: AICTE Officer has no assigned region zone.");
            }
            Institution inst = institutionRepository.findByAicteId(instId)
                    .or(() -> institutionRepository.findById(instId))
                    .orElseThrow(() -> new ResourceNotFoundException("Institution not found with ID: " + instId));
            if (inst.getZone() == null || !inst.getZone().name().equalsIgnoreCase(officerRegion.trim())) {
                throw new AccessDeniedException("Access denied: Institution '" + instId + "' is not located within your assigned region (" + officerRegion + ").");
            }
        }
    }

    @GetMapping("/officer/dashboard")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<OfficerDashboardDTO> getOfficerDashboard(
            @RequestParam(required = false) String zone,
            @AuthenticationPrincipal UserPrincipal principal) {
        RegionZone regionZone = resolveAndVerifyZone(zone, principal);
        OfficerDashboardDTO dto = dashboardService.getOfficerDashboard(regionZone);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/officer/compliance")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<ComplianceOverviewDTO>> getOfficerCompliance(
            @RequestParam(required = false) String zone,
            @RequestParam(required = false) String academicYear,
            @AuthenticationPrincipal UserPrincipal principal) {
        RegionZone regionZone = resolveAndVerifyZone(zone, principal);
        ComplianceOverviewDTO dto = dashboardService.getOfficerCompliance(regionZone, academicYear);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/officer/institutions")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<Map<String, Object>> getOfficerInstitutions(
            @RequestParam(required = false) String zone,
            @AuthenticationPrincipal UserPrincipal principal) {
        RegionZone regionZone = resolveAndVerifyZone(zone, principal);
        Map<String, Object> map = dashboardService.getOfficerInstitutions(regionZone);
        return ResponseEntity.ok(map);
    }

    @GetMapping("/officer/institutions/{id}/dossier")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<DossierDTO>> getInstitutionDossier(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        verifyInstitutionZone(id, principal);
        DossierDTO dossier = dashboardService.getInstitutionDossier(id);
        return ResponseEntity.ok(ApiResponse.success(dossier));
    }

    @PostMapping("/officer/institutions/{id}/commendation")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<String>> recordCommendation(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        verifyInstitutionZone(id, principal);
        Commendation c = Commendation.builder()
                .institutionId(id)
                .notes("AICTE Commendation for Exemplary Timely Compliance & Data Integrity")
                .awardedBy(principal != null ? principal.getEmail() : "AICTE_NODAL_OFFICER")
                .createdAt(Instant.now())
                .build();
        commendationRepository.save(c);

        auditService.logAsync("COMMENDATION_ISSUED", principal != null ? principal.getId() : "OFFICER",
                principal != null ? principal.getEmail() : "officer@aicte.gov.in",
                principal != null ? principal.getRole() : "ROLE_AICTE_OFFICER",
                id, "INSTITUTION", id, id, null, "Commendation awarded",
                request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        return ResponseEntity.ok(ApiResponse.success("Commendation recorded successfully for institution " + id));
    }

    @PostMapping("/officer/institutions/{id}/inquiries")
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<String>> createInquiry(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        verifyInstitutionZone(id, principal);
        String msg = body.getOrDefault("message", "Compliance inquiry");
        RegulatoryInquiry inquiry = RegulatoryInquiry.builder()
                .institutionId(id)
                .message(msg)
                .status("PENDING")
                .sentBy(principal != null ? principal.getEmail() : "AICTE_NODAL_OFFICER")
                .createdAt(Instant.now())
                .build();
        inquiryRepository.save(inquiry);

        auditService.logAsync("REGULATORY_INQUIRY_ISSUED", principal != null ? principal.getId() : "OFFICER",
                principal != null ? principal.getEmail() : "officer@aicte.gov.in",
                principal != null ? principal.getRole() : "ROLE_AICTE_OFFICER",
                id, "INSTITUTION", id, id, null, "Inquiry: " + msg,
                request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        return ResponseEntity.ok(ApiResponse.success("Regulatory inquiry created successfully with ID: " + inquiry.getId()));
    }

    @PostMapping(value = "/compliance/notices", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<ComplianceNotice>> createComplianceNoticeJson(
            @RequestBody Map<String, Object> bodyJson,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        return processNotice(bodyJson != null ? bodyJson : Map.of(), null, principal, request);
    }

    @PostMapping(value = "/compliance/notices", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<ComplianceNotice>> createComplianceNoticeMultipart(
            @RequestPart(value = "notice", required = false) String noticeJson,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        try {
            Map<String, Object> data = (noticeJson != null && !noticeJson.isBlank())
                    ? objectMapper.readValue(noticeJson, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {})
                    : Map.of();
            return processNotice(data, attachment, principal, request);
        } catch (Exception e) {
            log.error("Failed to parse compliance notice multipart payload", e);
            throw new RuntimeException("Could not create compliance notice: " + e.getMessage());
        }
    }

    private ResponseEntity<ApiResponse<ComplianceNotice>> processNotice(
            Map<String, Object> data,
            MultipartFile attachment,
            UserPrincipal principal,
            HttpServletRequest request) {
        try {
            if (data == null || data.isEmpty()) {
                throw new IllegalArgumentException("Notice payload is required");
            }

            String instId = (String) data.get("institutionId");
            verifyInstitutionZone(instId, principal);
            String noticeType = (String) data.getOrDefault("noticeType", "SHOW_CAUSE");
            String subject = (String) data.getOrDefault("subject", "Notice of Compliance Investigation");
            List<String> recipients = new java.util.ArrayList<>();
            Object recObj = data.get("recipients");
            if (recObj instanceof List<?> list) {
                for (Object item : list) {
                    if (item != null) recipients.add(item.toString());
                }
            }
            int days = data.get("responseDueInDays") != null ? Integer.parseInt(data.get("responseDueInDays").toString()) : 15;
            String charges = (String) data.get("chargeDetails");

            String attachmentFilename = null;
            if (attachment != null && !attachment.isEmpty()) {
                attachmentFilename = gridFsStorageService.storeFile(
                        attachment.getInputStream(),
                        attachment.getOriginalFilename(),
                        attachment.getContentType(),
                        instId,
                        "COMPLIANCE_NOTICE"
                );
            }

            ComplianceNotice notice = ComplianceNotice.builder()
                    .institutionId(instId)
                    .noticeType(noticeType)
                    .subject(subject)
                    .recipients(recipients)
                    .responseDueInDays(days)
                    .dueDate(Instant.now().plus(days, ChronoUnit.DAYS))
                    .chargeDetails(charges)
                    .attachmentFileName(attachmentFilename)
                    .sentBy(principal != null ? principal.getEmail() : "AICTE_NODAL_OFFICER")
                    .status("ISSUED")
                    .createdAt(Instant.now())
                    .build();

            noticeRepository.save(notice);

            auditService.logAsync("COMPLIANCE_NOTICE_ISSUED", principal != null ? principal.getId() : "OFFICER",
                    principal != null ? principal.getEmail() : "officer@aicte.gov.in",
                    principal != null ? principal.getRole() : "ROLE_AICTE_OFFICER",
                    instId, "INSTITUTION", instId, notice.getId(), null,
                    "Notice type: " + noticeType + ", Subject: " + subject,
                    request.getRemoteAddr(), request.getHeader("User-Agent"), null);

            return ResponseEntity.ok(ApiResponse.success(notice));
        } catch (Exception e) {
            log.error("Failed to create compliance notice", e);
            throw new RuntimeException("Could not create compliance notice: " + e.getMessage());
        }
    }
}

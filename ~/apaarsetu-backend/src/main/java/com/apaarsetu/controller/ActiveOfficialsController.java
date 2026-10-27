package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.User;
import com.apaarsetu.domain.enums.UserRole;
import com.apaarsetu.domain.enums.UserStatus;
import com.apaarsetu.dto.OfficialDTO;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.UserRepository;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/active/officials")
@RequiredArgsConstructor
public class ActiveOfficialsController {

    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<List<OfficialDTO>> getActiveOfficials() {
        List<User> users = userRepository.findByRoleIn(List.of(
                UserRole.ROLE_AICTE_OFFICER,
                UserRole.ROLE_INSTITUTION_ADMIN
        ));

        List<OfficialDTO> list = new ArrayList<>();
        for (User u : users) {
            String roleLabel = u.getRole() == UserRole.ROLE_AICTE_OFFICER ? "AICTE OFFICER" : "UNIVERSITY ADMIN";
            String scope;
            String zone = null;
            String instId = null;

            if (u.getRole() == UserRole.ROLE_AICTE_OFFICER) {
                zone = (u.getRegion() != null ? u.getRegion().name() : "NORTH") + " ZONE";
                scope = zone;
            } else {
                instId = u.getInstitutionId() != null ? u.getInstitutionId() : "AICTE-INST-1001";
                String instName = institutionRepository.findByAicteId(instId)
                        .map(Institution::getName)
                        .orElse("Delhi Institute of Technology & Management");
                scope = instName + " [" + instId + "]";
            }

            list.add(OfficialDTO.builder()
                    .id(u.getId())
                    .name(u.getFullName())
                    .email(u.getEmail())
                    .role(roleLabel)
                    .scope(scope)
                    .zone(zone)
                    .institutionId(instId)
                    .status(u.getStatus() != null ? u.getStatus().name() : "ACTIVE")
                    .verified(u.isMfaEnabled())
                    .lastLogin(u.getLastLogin() != null ? u.getLastLogin().toString() : Instant.now().toString())
                    .build());
        }

        return ResponseEntity.ok(list);
    }

    @RequestMapping(value = {"/{id}/status", "/{id}/duty"}, method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        User user = userRepository.findById(id)
                .orElseGet(() -> userRepository.findByEmail(id).orElse(null));
        if (user == null) {
            throw new ResourceNotFoundException("Official not found with ID or Email: " + id);
        }

        String statusStr = body.containsKey("status") ? body.get("status") : body.get("duty");
        if (statusStr == null || statusStr.isBlank()) {
            throw new IllegalArgumentException("Status or duty value is required");
        }

        UserStatus targetStatus;
        switch (statusStr.trim().toUpperCase()) {
            case "LOCKED" -> targetStatus = UserStatus.LOCKED;
            case "SUSPENDED" -> targetStatus = UserStatus.SUSPENDED;
            case "ON_LEAVE" -> targetStatus = UserStatus.ON_LEAVE;
            default -> targetStatus = UserStatus.ACTIVE;
        }

        user.setStatus(targetStatus);
        if (targetStatus == UserStatus.ACTIVE) {
            user.setFailedLoginAttempts(0);
        }
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        auditService.logAsync("UPDATE_OFFICIAL_STATUS",
                principal != null ? principal.getId() : "ADMIN",
                principal != null ? principal.getEmail() : "admin@aicte.gov.in",
                principal != null ? principal.getRole() : "ROLE_AICTE_ADMIN",
                null, "USER", user.getId(), user.getId(), null,
                "Updated status for official " + user.getFullName() + " (" + user.getEmail() + ") to " + targetStatus,
                request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        return ResponseEntity.ok(ApiResponse.success("Status updated to " + targetStatus.name()));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Official not found with ID: " + id));

        String newPassword = body.get("password");
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(true);
        user.setRequiresPasswordChange(true);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        auditService.logAsync("ADMIN_RESET_PASSWORD",
                principal != null ? principal.getId() : "ADMIN",
                principal != null ? principal.getEmail() : "admin@aicte.gov.in",
                principal != null ? principal.getRole() : "ROLE_AICTE_ADMIN",
                null, "USER", user.getId(), user.getId(), null,
                "Admin reset password for official " + user.getFullName() + " (" + user.getEmail() + ")",
                request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        return ResponseEntity.ok(ApiResponse.success("Password reset successfully for " + user.getFullName()));
    }
}

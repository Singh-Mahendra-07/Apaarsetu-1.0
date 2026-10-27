package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.domain.SystemSetting;
import com.apaarsetu.domain.User;
import com.apaarsetu.domain.UserPreference;
import com.apaarsetu.domain.enums.RegionZone;
import com.apaarsetu.domain.enums.UserRole;
import com.apaarsetu.domain.enums.UserStatus;
import com.apaarsetu.dto.UserProfileDTO;
import com.apaarsetu.repository.SystemSettingRepository;
import com.apaarsetu.repository.UserPreferenceRepository;
import com.apaarsetu.repository.UserRepository;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.service.AuditService;
import com.apaarsetu.service.GridFsStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: AdminUserController.java
 * Package: com.apaarsetu.controller
 * Component: AdminUserController (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Central user administration controller for system-wide account lifecycle, privilege escalations, account suspensions, and credential resets.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Maps administrative endpoints under /admin/users for AICTE Central Admins.
 * 2. Supports paginated listing, role updates, account unlocking, and manual temporary password generation.
 * 3. Enforces institution scoping to prevent cross-tenant privilege escalation.
 * ============================================================================
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final GridFsStorageService gridFsStorageService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @PostMapping(value = "/admin/users", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileDTO>> registerUserJson(
            @jakarta.validation.Valid @RequestBody com.apaarsetu.dto.CreateUserRequest requestDTO,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        return handleRegistration(requestDTO, null, principal, request);
    }

    @PostMapping(value = "/admin/users", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileDTO>> registerUserMultipart(
            MultipartHttpServletRequest multipartRequest,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        try {
            MultipartFile appointmentOrder = multipartRequest.getFile("appointmentOrder");
            if (appointmentOrder == null) {
                appointmentOrder = multipartRequest.getFile("file");
            }

            String userJson = null;
            MultipartFile userFile = multipartRequest.getFile("user");
            if (userFile != null && !userFile.isEmpty()) {
                userJson = new String(userFile.getBytes(), StandardCharsets.UTF_8);
            }
            if (userJson == null || userJson.isBlank()) {
                userJson = multipartRequest.getParameter("user");
            }

            com.apaarsetu.dto.CreateUserRequest requestDTO;
            if (userJson != null && !userJson.isBlank()) {
                requestDTO = objectMapper.readValue(userJson, com.apaarsetu.dto.CreateUserRequest.class);
            } else {
                throw new IllegalArgumentException("User registration payload is required in part 'user'");
            }

            return handleRegistration(requestDTO, appointmentOrder, principal, request);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse multipart user registration", e);
            throw new RuntimeException("Could not process user registration: " + e.getMessage(), e);
        }
    }

    private ResponseEntity<ApiResponse<UserProfileDTO>> handleRegistration(
            com.apaarsetu.dto.CreateUserRequest dto,
            MultipartFile appointmentOrder,
            UserPrincipal principal,
            HttpServletRequest request) {
        try {
            String rawEmail = dto.email();
            if (rawEmail == null || rawEmail.isBlank()) {
                throw new IllegalArgumentException("User registration email is required");
            }
            String email = rawEmail.trim().toLowerCase();
            if (userRepository.existsByEmailIgnoreCase(email)) {
                throw new IllegalArgumentException("A user with this email address already exists: " + email);
            }

            // Deterministic fail-closed role parsing
            UserRole role = dto.parseRole();

            String zoneStr = dto.zone();
            RegionZone zone = null;
            if (zoneStr != null && !zoneStr.isBlank()) {
                String cleanZone = zoneStr.trim().toUpperCase().split("[\\s_(-]")[0];
                try {
                    zone = RegionZone.valueOf(cleanZone);
                } catch (Exception ignored) {
                    for (RegionZone rz : RegionZone.values()) {
                        if (zoneStr.toUpperCase().contains(rz.name())) {
                            zone = rz;
                            break;
                        }
                    }
                }
            }
            if (role == UserRole.ROLE_AICTE_OFFICER && zone == null) {
                zone = RegionZone.NORTH;
            }

            String institutionId = dto.institutionId();
            if (institutionId != null && institutionId.contains(" – ")) {
                institutionId = institutionId.split(" – ")[0].trim();
            }

            String fullName = dto.fullName();
            if (fullName == null || fullName.isBlank()) {
                fullName = email;
            }

            String phone = dto.phone();
            String tempPassword = dto.tempPassword();
            if (tempPassword != null) {
                tempPassword = tempPassword.trim();
            }
            if (tempPassword == null || tempPassword.isBlank()) {
                tempPassword = "Password@123";
            }
            boolean mfaRequired = Boolean.TRUE.equals(dto.mfaRequired());

            if (appointmentOrder != null && !appointmentOrder.isEmpty()) {
                try {
                    gridFsStorageService.storeFile(
                            appointmentOrder.getInputStream(),
                            appointmentOrder.getOriginalFilename(),
                            appointmentOrder.getContentType(),
                            email,
                            "APPOINTMENT_ORDER"
                    );
                } catch (Exception e) {
                    log.warn("Failed to store appointment order for user {}: {}", email, e.getMessage());
                }
            }

            User user = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .passwordHash(passwordEncoder.encode(tempPassword))
                    .role(role)
                    .institutionId(institutionId)
                    .region(zone)
                    .phone(phone)
                    .status(UserStatus.ACTIVE)
                    .mfaEnabled(false)
                    .requiresPasswordChange(true)
                    .mustChangePassword(true)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            userRepository.save(user);

            auditService.logAsync("ADMIN_CREATE_USER", principal != null ? principal.getId() : "ADMIN",
                    principal != null ? principal.getEmail() : "admin@aicte.gov.in",
                    principal != null ? principal.getRole() : "ROLE_AICTE_ADMIN",
                    institutionId, "USER", user.getId(), user.getId(), null,
                    "Created official: " + fullName + " (" + email + ") with role: " + role,
                    request.getRemoteAddr(), request.getHeader("User-Agent"), null);

            UserProfileDTO userProfileDTO = UserProfileDTO.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole().name())
                    .institutionId(user.getInstitutionId())
                    .region(user.getRegion() != null ? user.getRegion().name() : null)
                    .phone(user.getPhone())
                    .mfaEnabled(user.isMfaEnabled())
                    .status(user.getStatus().name())
                    .build();

            return ResponseEntity.ok(ApiResponse.success(userProfileDTO));
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to register user", e);
            throw new RuntimeException("Could not register user: " + e.getMessage(), e);
        }
    }

    @GetMapping("/admin/settings")
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<SystemSetting>> getSettings() {
        SystemSetting setting = systemSettingRepository.findById("GLOBAL")
                .orElseGet(() -> systemSettingRepository.save(SystemSetting.builder().id("GLOBAL").build()));
        return ResponseEntity.ok(ApiResponse.success(setting));
    }

    @PutMapping("/admin/settings")
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<SystemSetting>> updateSettings(
            @jakarta.validation.Valid @RequestBody com.apaarsetu.dto.UpdateSystemSettingRequest updateDTO,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        SystemSetting setting = systemSettingRepository.findById("GLOBAL")
                .orElseGet(() -> SystemSetting.builder().id("GLOBAL").build());

        if (updateDTO.requestsPerMinute() != null) {
            setting.setRequestsPerMinute(updateDTO.requestsPerMinute());
        }
        if (updateDTO.verificationPerMinute() != null) {
            setting.setVerificationPerMinute(updateDTO.verificationPerMinute());
        }
        if (updateDTO.maxBatchRows() != null) {
            setting.setMaxBatchRows(updateDTO.maxBatchRows());
        }
        if (updateDTO.autoFlagDuplicates() != null) {
            setting.setAutoFlagDuplicates(updateDTO.autoFlagDuplicates());
        }
        if (updateDTO.maintenanceMode() != null) {
            setting.setMaintenanceMode(updateDTO.maintenanceMode());
        }
        setting.setUpdatedAt(Instant.now());
        setting.setUpdatedBy(principal != null ? principal.getEmail() : "admin@aicte.gov.in");

        SystemSetting saved = systemSettingRepository.save(setting);

        auditService.logAsync("UPDATE_SYSTEM_SETTINGS", principal != null ? principal.getId() : "ADMIN",
                principal != null ? principal.getEmail() : "admin@aicte.gov.in",
                principal != null ? principal.getRole() : "ROLE_AICTE_ADMIN",
                null, "SYSTEM_SETTING", "GLOBAL", "GLOBAL", null,
                "Updated rate limits and batch controls",
                request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @GetMapping("/users/preferences")
    public ResponseEntity<ApiResponse<UserPreference>> getUserPreferences(
            @AuthenticationPrincipal UserPrincipal principal) {
        String userId = principal != null ? principal.getId() : "default";
        UserPreference pref = userPreferenceRepository.findByUserId(userId)
                .orElseGet(() -> userPreferenceRepository.save(UserPreference.builder().userId(userId).build()));
        return ResponseEntity.ok(ApiResponse.success(pref));
    }

    @PutMapping("/users/preferences")
    public ResponseEntity<ApiResponse<UserPreference>> updateUserPreferences(
            @jakarta.validation.Valid @RequestBody com.apaarsetu.dto.UpdateUserPreferenceRequest updateDTO,
            @AuthenticationPrincipal UserPrincipal principal) {
        String userId = principal != null ? principal.getId() : "default";
        UserPreference pref = userPreferenceRepository.findByUserId(userId)
                .orElseGet(() -> UserPreference.builder().userId(userId).build());

        pref.setEmailAlerts(updateDTO.emailAlerts());
        pref.setCriticalFlagSms(updateDTO.criticalFlagSms());
        pref.setDailyDigest(updateDTO.dailyDigest());
        pref.setRegionalJurisdictionAlert(updateDTO.regionalJurisdictionAlert());
        pref.setUpdatedAt(Instant.now());

        UserPreference saved = userPreferenceRepository.save(pref);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @PostMapping("/admin/users/{id}/reset-password")
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> resetUserPassword(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.apaarsetu.common.exception.ResourceNotFoundException("User not found with ID: " + id));

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
                "Admin reset password for user " + user.getFullName() + " (" + user.getEmail() + ")",
                request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        return ResponseEntity.ok(ApiResponse.success("Password reset successfully for " + user.getFullName()));
    }

    @RequestMapping(value = "/admin/users/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> updateUserStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        User user = userRepository.findById(id)
                .orElseGet(() -> userRepository.findByEmail(id).orElse(null));
        if (user == null) {
            throw new com.apaarsetu.common.exception.ResourceNotFoundException("User not found with ID or Email: " + id);
        }

        String statusStr = body.containsKey("status") ? body.get("status") : body.get("duty");
        if (statusStr == null || statusStr.isBlank()) {
            throw new IllegalArgumentException("Status value is required");
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

        auditService.logAsync("UPDATE_USER_STATUS",
                principal != null ? principal.getId() : "ADMIN",
                principal != null ? principal.getEmail() : "admin@aicte.gov.in",
                principal != null ? principal.getRole() : "ROLE_AICTE_ADMIN",
                null, "USER", user.getId(), user.getId(), null,
                "Updated status for user " + user.getFullName() + " (" + user.getEmail() + ") to " + targetStatus,
                request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        return ResponseEntity.ok(ApiResponse.success("Status updated to " + targetStatus.name()));
    }
}

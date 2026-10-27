package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import com.apaarsetu.domain.Flag;
import com.apaarsetu.domain.User;
import com.apaarsetu.domain.enums.*;
import com.apaarsetu.dto.OfficerDTO;
import com.apaarsetu.repository.FlagRepository;
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

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/admin/officers")
@RequiredArgsConstructor
public class AdminOfficerController {

    private final UserRepository userRepository;
    private final FlagRepository flagRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<OfficerDTO.OfficerManagementResponse> getOfficers() {
        List<User> officerUsers = userRepository.findByRole(UserRole.ROLE_AICTE_OFFICER);
        List<Flag> allFlags = flagRepository.findAll();

        int criticalCount = 0;
        long totalTurnaroundSeconds = 0;
        int resolvedCount = 0;

        for (Flag f : allFlags) {
            if (f.getStatus() == FlagStatus.PENDING && f.getSeverity() == FlagSeverity.CRITICAL) {
                criticalCount++;
            }
            if (f.getStatus() == FlagStatus.RESOLVED && f.getResolvedAt() != null && f.getCreatedAt() != null) {
                Duration d = Duration.between(f.getCreatedAt(), f.getResolvedAt());
                totalTurnaroundSeconds += d.getSeconds();
                resolvedCount++;
            }
        }

        double turnaroundHrs = resolvedCount > 0
                ? Math.round(((double) totalTurnaroundSeconds / (resolvedCount * 3600.0)) * 10.0) / 10.0
                : 0.0;

        List<OfficerDTO> dtoList = new ArrayList<>();
        for (User u : officerUsers) {
            String zoneStr = u.getRegion() != null ? u.getRegion().name() : "NORTH";
            int openForOfficer = (int) allFlags.stream()
                    .filter(f -> f.getStatus() == FlagStatus.PENDING)
                    .count();
            int resolvedByOfficer = (int) allFlags.stream()
                    .filter(f -> f.getStatus() == FlagStatus.RESOLVED && u.getEmail().equalsIgnoreCase(f.getResolvedBy()))
                    .count();

            String duty = switch (u.getStatus()) {
                case ACTIVE -> "ON_DUTY";
                case SUSPENDED, LOCKED -> "SUSPENDED";
                default -> "ON_LEAVE";
            };

            dtoList.add(OfficerDTO.builder()
                    .id(u.getId())
                    .name(u.getFullName())
                    .email(u.getEmail())
                    .zone(zoneStr)
                    .duty(duty)
                    .open(openForOfficer)
                    .resolved(resolvedByOfficer)
                    .build());
        }

        OfficerDTO.OfficerSummary summary = OfficerDTO.OfficerSummary.builder()
                .criticalFlags(criticalCount)
                .turnaroundHrs(turnaroundHrs)
                .build();

        return ResponseEntity.ok(OfficerDTO.OfficerManagementResponse.builder()
                .officers(dtoList)
                .summary(summary)
                .success(true)
                .build());
    }

    @PostMapping(value = {"", "/appoint"})
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<OfficerDTO> appointOfficer(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        String officerId = body.get("officerId") != null ? body.get("officerId") : body.get("id");
        String email = body.get("email");
        String zoneStr = body.get("zone");

        RegionZone zone = RegionZone.NORTH;
        if (zoneStr != null && !zoneStr.isBlank()) {
            try {
                zone = RegionZone.valueOf(zoneStr.trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        // Case 1: Appoint or reassign an existing officer (by ID or Email)
        User existingUser = null;
        if (officerId != null && !officerId.isBlank()) {
            existingUser = userRepository.findById(officerId).orElse(null);
        }
        if (existingUser == null && email != null && !email.isBlank()) {
            existingUser = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        }

        if (existingUser != null) {
            RegionZone oldZone = existingUser.getRegion();
            existingUser.setRegion(zone);
            existingUser.setUpdatedAt(Instant.now());
            userRepository.save(existingUser);

            auditService.logAsync("APPOINT_OFFICER", principal != null ? principal.getId() : "ADMIN",
                    principal != null ? principal.getEmail() : "admin@aicte.gov.in",
                    principal != null ? principal.getRole() : "ROLE_AICTE_ADMIN",
                    null, "USER", existingUser.getId(), existingUser.getId(), null,
                    "Officer appointed/reassigned: " + existingUser.getFullName() + " (" + existingUser.getEmail() + ") from " + oldZone + " to zone: " + zone,
                    request.getRemoteAddr(), request.getHeader("User-Agent"), null);

            String duty = switch (existingUser.getStatus()) {
                case ACTIVE -> "ON_DUTY";
                case SUSPENDED, LOCKED -> "SUSPENDED";
                default -> "ON_LEAVE";
            };

            OfficerDTO updated = OfficerDTO.builder()
                    .id(existingUser.getId())
                    .name(existingUser.getFullName())
                    .email(existingUser.getEmail())
                    .zone(zone.name())
                    .duty(duty)
                    .open(0)
                    .resolved(0)
                    .build();

            return ResponseEntity.ok(updated);
        }

        // Case 2: New officer creation fallback (if full name and email are provided)
        String name = body.get("fullName");
        String password = body.get("tempPassword") != null ? body.get("tempPassword") : body.get("password");

        if (name == null || name.isBlank() || email == null || email.isBlank()) {
            throw new IllegalArgumentException("Either an existing officerId/email or a new officer fullName and email are required");
        }

        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            throw new IllegalArgumentException("An officer with email '" + email + "' already exists");
        }

        String rawPassword = (password != null && password.length() >= 8)
                ? password
                : "Officer@" + UUID.randomUUID().toString().substring(0, 8) + "!1";

        User user = User.builder()
                .fullName(name.trim())
                .email(email.trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(UserRole.ROLE_AICTE_OFFICER)
                .region(zone)
                .status(UserStatus.ACTIVE)
                .requiresPasswordChange(true)
                .mustChangePassword(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        userRepository.save(user);

        auditService.logAsync("APPOINT_OFFICER", principal != null ? principal.getId() : "ADMIN",
                principal != null ? principal.getEmail() : "admin@aicte.gov.in",
                principal != null ? principal.getRole() : "ROLE_AICTE_ADMIN",
                null, "USER", user.getId(), user.getId(), null,
                "Appointed new officer: " + name + " (" + email + ") to zone: " + zone,
                request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        OfficerDTO created = OfficerDTO.builder()
                .id(user.getId())
                .name(user.getFullName())
                .email(user.getEmail())
                .zone(zone.name())
                .duty("ON_DUTY")
                .open(0)
                .resolved(0)
                .build();

        return ResponseEntity.ok(created);
    }

    @RequestMapping(value = {"/{id}/duty", "/{id}/status"}, method = {RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.POST})
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> updateDuty(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        User user = userRepository.findById(id)
                .orElseGet(() -> userRepository.findByEmail(id).orElse(null));
        if (user == null) {
            throw new ResourceNotFoundException("Officer not found with ID or Email: " + id);
        }

        String dutyOrStatus = body.containsKey("status") ? body.get("status") : body.getOrDefault("duty", "ON_DUTY");
        switch (dutyOrStatus.toUpperCase()) {
            case "ON_DUTY", "ACTIVE" -> {
                user.setStatus(UserStatus.ACTIVE);
                user.setFailedLoginAttempts(0);
            }
            case "SUSPENDED" -> user.setStatus(UserStatus.SUSPENDED);
            case "LOCKED" -> user.setStatus(UserStatus.LOCKED);
            case "ON_LEAVE" -> user.setStatus(UserStatus.ON_LEAVE);
        }
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        auditService.logAsync("UPDATE_OFFICER_DUTY", principal != null ? principal.getId() : "ADMIN",
                principal != null ? principal.getEmail() : "admin@aicte.gov.in",
                principal != null ? principal.getRole() : "ROLE_AICTE_ADMIN",
                null, "USER", user.getId(), user.getId(), null,
                "Duty/Status updated to " + dutyOrStatus + " for " + user.getEmail(),
                request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        return ResponseEntity.ok(ApiResponse.success("Officer status updated to " + dutyOrStatus));
    }

    @RequestMapping(value = {"/{id}/transfer", "/{id}/appoint", "/{id}/zone"}, method = {RequestMethod.PUT, RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('AICTE_ADMIN')")
    public ResponseEntity<OfficerDTO> transferOfficer(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found with ID: " + id));

        String zoneStr = body.get("zone");
        RegionZone zone = RegionZone.NORTH;
        if (zoneStr != null && !zoneStr.isBlank()) {
            try {
                zone = RegionZone.valueOf(zoneStr.trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        RegionZone oldZone = user.getRegion();
        user.setRegion(zone);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        auditService.logAsync("TRANSFER_OFFICER", principal != null ? principal.getId() : "ADMIN",
                principal != null ? principal.getEmail() : "admin@aicte.gov.in",
                principal != null ? principal.getRole() : "ROLE_AICTE_ADMIN",
                null, "USER", user.getId(), user.getId(), null,
                "Officer " + user.getFullName() + " (" + user.getEmail() + ") transferred from " + oldZone + " to zone: " + zone,
                request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        String duty = switch (user.getStatus()) {
            case ACTIVE -> "ON_DUTY";
            case SUSPENDED, LOCKED -> "SUSPENDED";
            default -> "ON_LEAVE";
        };

        OfficerDTO dto = OfficerDTO.builder()
                .id(user.getId())
                .name(user.getFullName())
                .email(user.getEmail())
                .zone(zone.name())
                .duty(duty)
                .open(0)
                .resolved(0)
                .build();

        return ResponseEntity.ok(dto);
    }
}

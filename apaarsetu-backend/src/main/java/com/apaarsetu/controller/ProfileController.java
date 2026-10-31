package com.apaarsetu.controller;

import com.apaarsetu.common.exception.BadRequestException;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.RevokedToken;
import com.apaarsetu.domain.User;
import com.apaarsetu.dto.UserProfileDTO;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.RevokedTokenRepository;
import com.apaarsetu.repository.UserRepository;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.security.jwt.JwtTokenProvider;
import com.apaarsetu.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: ProfileController.java
 * Package: com.apaarsetu.controller
 * Component: ProfileController (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Allows authenticated users across all roles to view and manage their personal
 * profile, avatar, preferences, and security settings.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Exposes GET /profile/me returning user details from the authenticated
 * UserPrincipal.
 * 2. Exposes PUT /profile/preferences for persisting UI theme, language, and
 * table density options.
 * 3. Validates contact phone numbers and optional profile details.
 * ============================================================================
 */
@Slf4j
@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    private String getAuthenticatedEmail(UserPrincipal principal) {
        if (principal == null || principal.getEmail() == null || principal.getEmail().isBlank()) {
            throw new AccessDeniedException("Authentication required to access user profile");
        }
        return principal.getEmail().trim().toLowerCase();
    }

    @GetMapping
    public ResponseEntity<UserProfileDTO> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        String email = getAuthenticatedEmail(principal);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for email: " + email));

        String instName = null;
        if (user.getInstitutionId() != null) {
            instName = institutionRepository.findByAicteId(user.getInstitutionId())
                    .map(Institution::getName).orElse(null);
        }

        UserProfileDTO dto = UserProfileDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .institutionId(user.getInstitutionId())
                .institutionName(instName)
                .region(user.getRegion() != null ? user.getRegion().name() : null)
                .phone(user.getPhone())
                .photoUrl(user.getPhotoUrl())
                .mfaEnabled(user.isMfaEnabled())
                .status(user.getStatus().name())
                .lastLogin(user.getLastLogin() != null ? user.getLastLogin().toString() : Instant.now().toString())
                .build();

        return ResponseEntity.ok(dto);
    }

    @RequestMapping(value = "/photo", method = { RequestMethod.POST,
            RequestMethod.PUT }, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @RequestParam("photo") MultipartFile photo,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        try {
            String email = getAuthenticatedEmail(principal);
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            if (photo == null || photo.isEmpty()) {
                throw new BadRequestException("Photo file cannot be empty");
            }
            if (photo.getSize() > 500 * 1024) {
                throw new BadRequestException("Photo file size exceeds maximum limit of 500KB");
            }

            String mimeType = photo.getContentType() != null ? photo.getContentType() : "image/jpeg";
            if (!mimeType.equalsIgnoreCase("image/jpeg") && !mimeType.equalsIgnoreCase("image/png")
                    && !mimeType.equalsIgnoreCase("image/webp")) {
                throw new BadRequestException("Invalid photo format: Only JPEG, PNG, and WebP are allowed");
            }

            byte[] bytes = photo.getBytes();
            if (!isValidImage(bytes, mimeType)) {
                throw new BadRequestException("Invalid image header: File content does not match image format");
            }

            String base64Data = Base64.getEncoder().encodeToString(bytes);
            String dataUrl = "data:" + mimeType + ";base64," + base64Data;

            user.setPhotoUrl(dataUrl);
            user.setUpdatedAt(Instant.now());
            userRepository.save(user);

            auditService.logAsync("UPDATE_PROFILE_PHOTO", user.getId(), user.getEmail(), user.getRole().name(),
                    user.getInstitutionId(), "USER", user.getId(), user.getId(), null,
                    "Updated profile photo", request.getRemoteAddr(), request.getHeader("User-Agent"), null);

            return ResponseEntity.ok(Map.of("photoUrl", dataUrl));
        } catch (AccessDeniedException | BadRequestException | ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to upload photo", e);
            throw new RuntimeException("Could not upload photo: " + e.getMessage());
        }
    }

    @DeleteMapping("/photo")
    public ResponseEntity<Map<String, Object>> deletePhoto(
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        String email = getAuthenticatedEmail(principal);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPhotoUrl(null);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        auditService.logAsync("DELETE_PROFILE_PHOTO", user.getId(), user.getEmail(), user.getRole().name(),
                user.getInstitutionId(), "USER", user.getId(), user.getId(), null,
                "Removed profile photo", request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("photoUrl", null);
        response.put("message", "Profile photo removed successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/email")
    public ResponseEntity<Map<String, String>> updateEmail(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        String currentEmail = getAuthenticatedEmail(principal);
        User user = userRepository.findByEmailIgnoreCase(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String newEmail = body.get("newEmail");
        String currentPassword = body.get("currentPassword");

        if (newEmail == null || newEmail.isBlank() || currentPassword == null) {
            throw new IllegalArgumentException("New email and current password are required");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password does not match");
        }

        if (userRepository.existsByEmailIgnoreCase(newEmail.trim().toLowerCase())) {
            throw new IllegalArgumentException("Email already in use by another account");
        }

        user.setEmail(newEmail.trim().toLowerCase());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        revokeCurrentSessionToken(request);

        auditService.logAsync("UPDATE_PROFILE_EMAIL", user.getId(), user.getEmail(), user.getRole().name(),
                user.getInstitutionId(), "USER", user.getId(), user.getId(), null,
                "Updated email to " + newEmail, request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        return ResponseEntity.ok(Map.of("message", "Email updated successfully"));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> updatePassword(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        String currentEmail = getAuthenticatedEmail(principal);
        User user = userRepository.findByEmailIgnoreCase(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Current password and new password (minimum 8 characters) are required");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setRequiresPasswordChange(false);
        user.setMustChangePassword(false);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        revokeCurrentSessionToken(request);

        auditService.logAsync("UPDATE_PROFILE_PASSWORD", user.getId(), user.getEmail(), user.getRole().name(),
                user.getInstitutionId(), "USER", user.getId(), user.getId(), null,
                "Updated password", request.getRemoteAddr(), request.getHeader("User-Agent"), null);

        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    private void revokeCurrentSessionToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            try {
                String tokenHash = jwtTokenProvider.hashToken(token);
                RevokedToken revoked = RevokedToken.builder()
                        .tokenHash(tokenHash)
                        .revokedAt(Instant.now())
                        .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                        .build();
                revokedTokenRepository.save(revoked);
                log.info("Revoked active JWT session token following credential update");
            } catch (Exception ex) {
                log.warn("Could not register token revocation: {}", ex.getMessage());
            }
        }
    }

    private boolean isValidImage(byte[] bytes, String mimeType) {
        if (bytes == null || bytes.length < 12)
            return false;
        if (mimeType.equalsIgnoreCase("image/jpeg")) {
            return (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF;
        } else if (mimeType.equalsIgnoreCase("image/png")) {
            return (bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G';
        } else if (mimeType.equalsIgnoreCase("image/webp")) {
            return bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                    && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
        }
        return false;
    }
}
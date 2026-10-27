package com.apaarsetu.service;

import com.apaarsetu.common.exception.ForbiddenException;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import com.apaarsetu.common.exception.UnauthorizedException;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.RevokedToken;
import com.apaarsetu.domain.User;
import com.apaarsetu.domain.enums.UserStatus;
import com.apaarsetu.dto.*;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.RevokedTokenRepository;
import com.apaarsetu.repository.UserRepository;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.security.crypto.TotpService;
import com.apaarsetu.security.jwt.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final RevokedTokenRepository revokedTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final TotpService totpService;
    private final AuditService auditService;
    private final org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;
    private final com.apaarsetu.security.crypto.AesEncryptionService aesEncryptionService;

    public LoginResponse login(LoginRequest request, String clientIp, String userAgent) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .orElseThrow(() -> new UnauthorizedException("Invalid email or password")));

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new ForbiddenException("Account locked due to 5 consecutive failed login attempts. Contact an administrator to unlock.");
        }
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new ForbiddenException("Account is currently suspended. Access denied.");
        }

        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash())
                || (user.getSecondaryPasswordHash() != null && passwordEncoder.matches(request.getPassword(), user.getSecondaryPasswordHash()));

        if (!matches) {
            int failedAttempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(failedAttempts);
            if (failedAttempts >= 5) {
                user.setStatus(UserStatus.LOCKED);
                log.warn("Account locked for user '{}' after 5 failed attempts", email);
            }
            userRepository.save(user);
            throw new UnauthorizedException("Invalid email or password");
        }

        // Reset failed login attempts and update last login
        user.setFailedLoginAttempts(0);
        user.setLastLogin(Instant.now());
        userRepository.save(user);

        UserPrincipal principal = buildPrincipal(user);

        // Check if MFA is required and configured with a secret
        if (user.isMfaEnabled() && user.getMfaSecret() != null && !user.getMfaSecret().isBlank()) {
            String challengeToken = jwtTokenProvider.generateMfaChallengeToken(user.getId(), user.getEmail());
            log.info("MFA required for user '{}', challenge token issued", email);
            return LoginResponse.builder()
                    .mfaRequired(true)
                    .userId(user.getId())
                    .challengeToken(challengeToken)
                    .user(toUserProfileDTO(user))
                    .requiresPasswordChange(user.isRequiresPasswordChange())
                    .build();
        }

        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(principal);

        auditService.logAsync("USER_LOGIN", user.getId(), user.getEmail(), user.getRole().name(),
                user.getInstitutionId(), "USER", user.getId(), user.getId(), null, user.getFullName(),
                clientIp, userAgent, null);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .expiresInMs(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(toUserProfileDTO(user))
                .mfaRequired(false)
                .requiresPasswordChange(user.isRequiresPasswordChange())
                .build();
    }

    public LoginResponse verifyMfa(MfaVerifyRequest request, String clientIp, String userAgent) {
        String challengeToken = request.getChallengeToken();
        if (challengeToken == null || challengeToken.isBlank()) {
            throw new UnauthorizedException("MFA challenge token is required");
        }

        if (!jwtTokenProvider.validateToken(challengeToken)) {
            throw new UnauthorizedException("MFA challenge token expired or invalid");
        }

        Claims claims = jwtTokenProvider.parseClaims(challengeToken);
        String purpose = claims.get("purpose", String.class);
        if (!"MFA_CHALLENGE".equalsIgnoreCase(purpose)) {
            throw new UnauthorizedException("Invalid token presented for MFA challenge verification");
        }

        String tokenUserId = claims.getSubject();
        String reqUserId = request.getUserId();
        if (reqUserId != null && !reqUserId.isBlank() && !reqUserId.equals(tokenUserId)) {
            throw new UnauthorizedException("MFA token does not match user ID");
        }

        User user = userRepository.findById(tokenUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isMfaEnabled() || user.getMfaSecret() == null) {
            throw new UnauthorizedException("MFA is not enabled for this user account");
        }

        // Decrypt secret if stored encrypted or migrate legacy plaintext secret
        String rawSecret = aesEncryptionService.decrypt(user.getMfaSecret());
        if (!user.getMfaSecret().startsWith("enc:v1:")) {
            user.setMfaSecret(aesEncryptionService.encrypt(rawSecret));
            userRepository.save(user);
        }

        Optional<Long> verifiedStep = totpService.verifyCode(rawSecret, request.getOtpCode(), user.getLastTotpTimeStep());
        if (verifiedStep.isEmpty()) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid or expired 6-digit TOTP verification code");
        }

        // Database-Level Atomic TOTP Replay Prevention (Fix TOCTOU Race Condition)
        org.springframework.data.mongodb.core.query.Query atomicQuery = new org.springframework.data.mongodb.core.query.Query(
                org.springframework.data.mongodb.core.query.Criteria.where("_id").is(user.getId())
                        .orOperator(
                                org.springframework.data.mongodb.core.query.Criteria.where("lastTotpTimeStep").lt(verifiedStep.get()),
                                org.springframework.data.mongodb.core.query.Criteria.where("lastTotpTimeStep").is(null)
                        )
        );
        org.springframework.data.mongodb.core.query.Update atomicUpdate = new org.springframework.data.mongodb.core.query.Update()
                .set("lastTotpTimeStep", verifiedStep.get())
                .set("lastLogin", Instant.now());
        org.springframework.data.mongodb.core.FindAndModifyOptions options = org.springframework.data.mongodb.core.FindAndModifyOptions.options().returnNew(true);

        User updatedUser = mongoTemplate.findAndModify(atomicQuery, atomicUpdate, options, User.class);
        if (updatedUser == null) {
            log.warn("Atomic TOTP replay detected for user '{}' on step {}", user.getEmail(), verifiedStep.get());
            throw new org.springframework.security.authentication.BadCredentialsException("TOTP code has already been used");
        }
        user = updatedUser;

        UserPrincipal principal = buildPrincipal(user);
        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(principal);

        auditService.logAsync("MFA_VERIFIED_LOGIN", user.getId(), user.getEmail(), user.getRole().name(),
                user.getInstitutionId(), "USER", user.getId(), user.getId(), null, user.getFullName(),
                clientIp, userAgent, null);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .expiresInMs(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(toUserProfileDTO(user))
                .mfaRequired(false)
                .requiresPasswordChange(user.isRequiresPasswordChange())
                .build();
    }

    public MfaSetupResponse setupMfa(UserPrincipal principal) {
        String secret = totpService.generateSecret();
        String qrUri = totpService.buildQrCodeUri(principal.getEmail(), secret);
        return MfaSetupResponse.builder()
                .secret(secret)
                .qrCodeUri(qrUri)
                .build();
    }

    public String enableMfa(UserPrincipal principal, MfaEnableRequest request) {
        Optional<Long> verifiedStep = totpService.verifyCode(request.getSecret(), request.getCode(), null);
        if (verifiedStep.isEmpty()) {
            throw new UnauthorizedException("Invalid 6-digit verification code for MFA secret activation");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setMfaEnabled(true);
        // Encrypt secret at rest before persisting
        user.setMfaSecret(aesEncryptionService.encrypt(request.getSecret()));
        user.setLastTotpTimeStep(verifiedStep.get());
        userRepository.save(user);

        log.info("MFA enabled successfully with encrypted secret for user '{}'", user.getEmail());
        return "MFA has been successfully configured and enabled on your account.";
    }

    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }

        Claims claims = jwtTokenProvider.parseClaims(token);
        String tokenType = claims.get("tokenType", String.class);
        if (!"REFRESH".equalsIgnoreCase(tokenType)) {
            throw new UnauthorizedException("Supplied token is not a refresh token");
        }

        String userId = claims.getSubject();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User associated with token no longer exists"));

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.LOCKED) {
            throw new ForbiddenException("User account is inactive");
        }

        // Invalidate old refresh token (token rotation)
        logout(token);

        UserPrincipal principal = buildPrincipal(user);
        String newAccessToken = jwtTokenProvider.generateAccessToken(principal);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(principal);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .expiresInMs(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(toUserProfileDTO(user))
                .requiresPasswordChange(user.isRequiresPasswordChange())
                .build();
    }

    public void logout(String token) {
        if (token == null || token.isBlank()) return;
        try {
            String tokenHash = jwtTokenProvider.hashToken(token);
            Claims claims = jwtTokenProvider.parseClaims(token);
            Instant expiresAt = claims.getExpiration().toInstant();

            RevokedToken revokedToken = RevokedToken.builder()
                    .tokenHash(tokenHash)
                    .revokedAt(Instant.now())
                    .expiresAt(expiresAt)
                    .build();

            revokedTokenRepository.save(revokedToken);
            log.debug("Revoked token recorded in MongoDB revoked_tokens: {}", tokenHash);
        } catch (Exception e) {
            log.warn("Could not parse or revoke token during logout: {}", e.getMessage());
        }
    }

    public UserProfileDTO getMe(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toUserProfileDTO(user);
    }

    public UserPrincipal buildPrincipal(User user) {
        return UserPrincipal.builder()
                .id(user.getId())
                .email(user.getEmail())
                .password(user.getPasswordHash())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .institutionId(user.getInstitutionId())
                .region(user.getRegion() != null ? user.getRegion().name() : null)
                .status(user.getStatus().name())
                .mfaEnabled(user.isMfaEnabled())
                .requiresPasswordChange(user.isRequiresPasswordChange())
                .build();
    }

    public UserProfileDTO toUserProfileDTO(User user) {
        String instName = null;
        if (user.getInstitutionId() != null) {
            Optional<Institution> inst = institutionRepository.findByAicteId(user.getInstitutionId());
            if (inst.isEmpty()) {
                inst = institutionRepository.findById(user.getInstitutionId());
            }
            instName = inst.map(Institution::getName).orElse(user.getInstitutionId());
        }

        return UserProfileDTO.builder()
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
                .lastLogin(user.getLastLogin() != null ? user.getLastLogin().toString() : null)
                .status(user.getStatus().name())
                .requiresPasswordChange(user.isRequiresPasswordChange())
                .build();
    }

    public LoginResponse resetFirstTimePassword(UserPrincipal principal, FirstTimePasswordResetRequest request, String clientIp, String userAgent) {
        return resetFirstTimePassword(principal, request, null, clientIp, userAgent);
    }

    public LoginResponse resetFirstTimePassword(UserPrincipal principal, FirstTimePasswordResetRequest request, String oldToken, String clientIp, String userAgent) {
        if (principal == null || principal.getId() == null) {
            throw new UnauthorizedException("Authentication required to reset password");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + principal.getId()));

        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank()
                && !request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }

        // Verify that the new password is not identical to the current temporary password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("New password cannot be identical to the temporary password. Please choose a new permanent password.");
        }

        // Hash new password and permanently destroy the one-time temporary password
        String newHash = passwordEncoder.encode(request.getNewPassword());
        user.setPasswordHash(newHash);
        user.setSecondaryPasswordHash(null);
        user.setRequiresPasswordChange(false);
        user.setMustChangePassword(false);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        // Permanently revoke the old temporary access token so it can never be used again
        if (oldToken != null && !oldToken.isBlank()) {
            logout(oldToken);
            log.info("Revoked temporary access token for user '{}' upon password change", user.getEmail());
        }

        log.info("First-time temporary password resolved and permanent password established for user '{}'", user.getEmail());

        auditService.logAsync("FIRST_TIME_PASSWORD_RESET", user.getId(), user.getEmail(), user.getRole().name(),
                user.getInstitutionId(), "USER", user.getId(), user.getId(), null,
                "User completed mandatory first-time password reset and unlocked platform access",
                clientIp, userAgent, null);

        // Issue fresh unrestricted tokens
        UserPrincipal updatedPrincipal = buildPrincipal(user);
        String newAccessToken = jwtTokenProvider.generateAccessToken(updatedPrincipal);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(updatedPrincipal);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .expiresInMs(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(toUserProfileDTO(user))
                .requiresPasswordChange(false)
                .mfaRequired(false)
                .build();
    }
}

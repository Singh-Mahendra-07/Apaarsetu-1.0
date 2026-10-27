package com.apaarsetu.security;

import com.apaarsetu.domain.User;
import com.apaarsetu.domain.enums.UserRole;
import com.apaarsetu.domain.enums.UserStatus;
import com.apaarsetu.dto.FirstTimePasswordResetRequest;
import com.apaarsetu.dto.LoginRequest;
import com.apaarsetu.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: PasswordChangeEnforcementIntegrationTest.java
 * Package: com.apaarsetu.security
 * Component: PasswordChangeEnforcementIntegrationTest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Integration and regression test suite verifying 'PasswordChangeEnforcementIntegrationTest' security, business rules, and stability.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Uses SpringBootTest, MockMvc, and embedded or test MongoDB instances.
 * 2. Asserts correct behavior for authorization, business constraints, and error envelopes.
 * 3. Serves as automated regression prevention during continuous integration builds.
 * ============================================================================
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("First-Time Password Reset, Old Token Invalidation, and Account Lockout Suite")
public class PasswordChangeEnforcementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Lifecycle: Temporary token blocked, password reset destroys temp password, old token invalidated, new token granted access")
    void testMandatoryPasswordResetLifecycle() throws Exception {
        String email = "temp-official-" + UUID.randomUUID().toString().substring(0, 8) + "@test.ac.in";
        String tempPassword = "TempPassword@123";

        User user = User.builder()
                .email(email)
                .fullName("Temporary Test Official")
                .passwordHash(passwordEncoder.encode(tempPassword))
                .role(UserRole.ROLE_INSTITUTION_ADMIN)
                .institutionId("AICTE-INST-1001")
                .status(UserStatus.ACTIVE)
                .requiresPasswordChange(true)
                .mustChangePassword(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User savedUser = userRepository.save(user);
        String savedUserId = savedUser.getId();

        try {
            // 1. Authenticate with temporary password -> Expect requiresPasswordChange = true in payload
            LoginRequest loginReq = new LoginRequest();
            loginReq.setEmail(email);
            loginReq.setPassword(tempPassword);

            String loginResponse = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.requiresPasswordChange").value(true))
                    .andExpect(jsonPath("$.data.user.requiresPasswordChange").value(true))
                    .andReturn().getResponse().getContentAsString();

            String token = objectMapper.readTree(loginResponse).path("data").path("accessToken").asText();
            assertNotNull(token, "Access token must not be null");
            assertFalse(token.isBlank(), "Access token must not be blank");

            // 2. Protected backend service access MUST be blocked with 403 Forbidden for temporary token
            mockMvc.perform(get("/institutions")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.errorCode").value("PASSWORD_CHANGE_REQUIRED"));

            // 3. Submitting matching, strong new permanent password to /auth/first-time-password succeeds
            String newPermanentPassword = "PermanentSecurePass#2026";
            FirstTimePasswordResetRequest resetReq = FirstTimePasswordResetRequest.builder()
                    .newPassword(newPermanentPassword)
                    .confirmPassword(newPermanentPassword)
                    .build();

            String resetResponse = mockMvc.perform(post("/auth/first-time-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(resetReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.requiresPasswordChange").value(false))
                    .andReturn().getResponse().getContentAsString();

            String freshToken = objectMapper.readTree(resetResponse).path("data").path("accessToken").asText();
            assertNotNull(freshToken, "Fresh access token must not be null");
            assertFalse(freshToken.isBlank(), "Fresh access token must not be blank");
            assertNotEquals(token, freshToken, "Fresh token must be distinct from old temporary token");

            // 4. Verify MongoDB state: both requiresPasswordChange and mustChangePassword are false
            User updated = userRepository.findById(savedUserId).orElseThrow();
            assertFalse(updated.isRequiresPasswordChange(), "requiresPasswordChange must be false");
            assertFalse(updated.isMustChangePassword(), "mustChangePassword must be false");
            assertTrue(passwordEncoder.matches(newPermanentPassword, updated.getPasswordHash()));
            assertFalse(passwordEncoder.matches(tempPassword, updated.getPasswordHash()));

            // 5. CRITICAL TEST: Old access token MUST be rejected after password reset (revoked!)
            mockMvc.perform(get("/institutions")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isUnauthorized());

            // 6. Access to protected backend service with fresh token is granted
            mockMvc.perform(get("/institutions")
                            .header("Authorization", "Bearer " + freshToken))
                    .andExpect(status().isOk());
        } finally {
            if (savedUserId != null) {
                userRepository.deleteById(savedUserId);
            }
        }
    }

    @Test
    @DisplayName("Rejects weak, non-conforming, and mismatched passwords during first-time reset")
    void testWeakAndMismatchedPasswordRejection() throws Exception {
        String email = "validation-test-" + UUID.randomUUID().toString().substring(0, 8) + "@test.ac.in";
        String tempPassword = "TempPassword@123";

        User user = User.builder()
                .email(email)
                .fullName("Validation Test Official")
                .passwordHash(passwordEncoder.encode(tempPassword))
                .role(UserRole.ROLE_AICTE_OFFICER)
                .status(UserStatus.ACTIVE)
                .requiresPasswordChange(true)
                .mustChangePassword(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User savedUser = userRepository.save(user);
        String savedUserId = savedUser.getId();

        try {
            LoginRequest loginReq = new LoginRequest();
            loginReq.setEmail(email);
            loginReq.setPassword(tempPassword);

            String loginResponse = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            String token = objectMapper.readTree(loginResponse).path("data").path("accessToken").asText();
            assertNotNull(token);
            assertFalse(token.isBlank());

            // Case A: Too short (< 10 chars)
            FirstTimePasswordResetRequest tooShort = FirstTimePasswordResetRequest.builder()
                    .newPassword("Short1!")
                    .confirmPassword("Short1!")
                    .build();
            mockMvc.perform(post("/auth/first-time-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(tooShort)))
                    .andExpect(status().isBadRequest());

            // Case B: No uppercase letter
            FirstTimePasswordResetRequest noUpper = FirstTimePasswordResetRequest.builder()
                    .newPassword("lowercaseonly123!")
                    .confirmPassword("lowercaseonly123!")
                    .build();
            mockMvc.perform(post("/auth/first-time-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(noUpper)))
                    .andExpect(status().isBadRequest());

            // Case C: No numbers
            FirstTimePasswordResetRequest noDigits = FirstTimePasswordResetRequest.builder()
                    .newPassword("NoDigitsInThisPassword!")
                    .confirmPassword("NoDigitsInThisPassword!")
                    .build();
            mockMvc.perform(post("/auth/first-time-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(noDigits)))
                    .andExpect(status().isBadRequest());

            // Case D: Mismatched confirmPassword
            FirstTimePasswordResetRequest mismatch = FirstTimePasswordResetRequest.builder()
                    .newPassword("ValidPassword123#")
                    .confirmPassword("CompletelyDifferentPass123#")
                    .build();
            mockMvc.perform(post("/auth/first-time-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(mismatch)))
                    .andExpect(status().isBadRequest());

            // Case E: Reusing the same temporary password
            FirstTimePasswordResetRequest sameAsTemp = FirstTimePasswordResetRequest.builder()
                    .newPassword(tempPassword)
                    .confirmPassword(tempPassword)
                    .build();
            mockMvc.perform(post("/auth/first-time-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(sameAsTemp)))
                    .andExpect(status().isBadRequest());
        } finally {
            if (savedUserId != null) {
                userRepository.deleteById(savedUserId);
            }
        }
    }

    @Test
    @DisplayName("Enforces account lockout: 5 consecutive failed login attempts locks account with 403 Forbidden")
    void testAccountLockoutAfterFiveFailedAttempts() throws Exception {
        String email = "lockout-test-" + UUID.randomUUID().toString().substring(0, 8) + "@test.ac.in";
        String password = "CorrectPassword@123";

        User user = User.builder()
                .email(email)
                .fullName("Lockout Test Official")
                .passwordHash(passwordEncoder.encode(password))
                .role(UserRole.ROLE_INSTITUTION_OPERATOR)
                .status(UserStatus.ACTIVE)
                .failedLoginAttempts(0)
                .requiresPasswordChange(false)
                .mustChangePassword(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User savedUser = userRepository.save(user);
        String savedUserId = savedUser.getId();

        try {
            LoginRequest badReq = new LoginRequest();
            badReq.setEmail(email);
            badReq.setPassword("WrongPassword#999");

            // Attempts 1 through 5: invalid credentials (401 Unauthorized)
            for (int i = 1; i <= 5; i++) {
                mockMvc.perform(post("/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(badReq)))
                        .andExpect(status().isUnauthorized());
            }

            // Verify account status transitioned to LOCKED in MongoDB
            User lockedUser = userRepository.findById(savedUserId).orElseThrow();
            assertEquals(UserStatus.LOCKED, lockedUser.getStatus(), "User account must be in LOCKED status");
            assertEquals(5, lockedUser.getFailedLoginAttempts(), "Failed login attempts must be recorded as 5");

            // Attempt 6 (even with correct password): MUST be blocked with 403 Forbidden due to account lockout
            LoginRequest correctReq = new LoginRequest();
            correctReq.setEmail(email);
            correctReq.setPassword(password);

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(correctReq)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Account locked due to 5 consecutive failed login attempts")));
        } finally {
            if (savedUserId != null) {
                userRepository.deleteById(savedUserId);
            }
        }
    }
}

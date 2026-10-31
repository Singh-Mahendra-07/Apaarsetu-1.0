package com.apaarsetu.service;

import com.apaarsetu.common.exception.UnauthorizedException;
import com.apaarsetu.domain.User;
import com.apaarsetu.domain.enums.UserRole;
import com.apaarsetu.domain.enums.UserStatus;
import com.apaarsetu.dto.LoginRequest;
import com.apaarsetu.dto.LoginResponse;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.RevokedTokenRepository;
import com.apaarsetu.repository.UserRepository;
import com.apaarsetu.security.crypto.AesEncryptionService;
import com.apaarsetu.security.crypto.TotpService;
import com.apaarsetu.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VULN-01 Regression: Secondary Password Backdoor Elimination Suite")
class AuthServiceSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    @Mock
    private RevokedTokenRepository revokedTokenRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private TotpService totpService;

    @Mock
    private AuditService auditService;

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private AesEncryptionService aesEncryptionService;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private AuthService authService;

    private User targetUser;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                institutionRepository,
                revokedTokenRepository,
                passwordEncoder,
                jwtTokenProvider,
                totpService,
                auditService,
                mongoTemplate,
                aesEncryptionService
        );

        targetUser = User.builder()
                .id("user-admin-01")
                .email("admin@aicte.gov.in")
                .fullName("AICTE Admin")
                .role(UserRole.ROLE_AICTE_ADMIN)
                .passwordHash(passwordEncoder.encode("StrongUniqueAdminPassword@2026"))
                .status(UserStatus.ACTIVE)
                .mfaEnabled(false)
                .failedLoginAttempts(0)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("VULN-01: Login with secondary password backdoor 'Password@123' must be rejected with UnauthorizedException")
    void testSecondaryPasswordBackdoorRejected() {
        when(userRepository.findByEmailIgnoreCase("admin@aicte.gov.in"))
                .thenReturn(Optional.of(targetUser));

        LoginRequest request = new LoginRequest();
        request.setEmail("admin@aicte.gov.in");
        request.setPassword("Password@123");

        assertThrows(UnauthorizedException.class, () -> {
            authService.login(request, "127.0.0.1", "JUnit-Test");
        }, "Login with static secondary password backdoor must throw UnauthorizedException");

        assertEquals(1, targetUser.getFailedLoginAttempts());
        verify(userRepository).save(targetUser);
    }

    @Test
    @DisplayName("VULN-01: Login with valid primary password succeeds and resets failed attempts")
    void testPrimaryPasswordAuthenticationSucceeds() {
        when(userRepository.findByEmailIgnoreCase("admin@aicte.gov.in"))
                .thenReturn(Optional.of(targetUser));
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("mock-access-jwt");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("mock-refresh-jwt");

        LoginRequest request = new LoginRequest();
        request.setEmail("admin@aicte.gov.in");
        request.setPassword("StrongUniqueAdminPassword@2026");

        LoginResponse response = authService.login(request, "127.0.0.1", "JUnit-Test");

        assertNotNull(response);
        assertEquals("mock-access-jwt", response.getAccessToken());
        assertEquals(0, targetUser.getFailedLoginAttempts());
        assertFalse(response.isMfaRequired());
    }
}

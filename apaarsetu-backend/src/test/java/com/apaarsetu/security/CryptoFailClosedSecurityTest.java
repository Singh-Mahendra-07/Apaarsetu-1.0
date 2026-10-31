package com.apaarsetu.security;

import com.apaarsetu.repository.RevokedTokenRepository;
import com.apaarsetu.security.crypto.AesEncryptionService;
import com.apaarsetu.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VULN-03 Regression: Cryptographic Secrets Fail-Closed Security Suite")
class CryptoFailClosedSecurityTest {

    @Mock
    private RevokedTokenRepository revokedTokenRepository;

    @Test
    @DisplayName("VULN-03: Production environment fails closed if default hardcoded JWT secret is configured")
    void testJwtSecretFailsClosedInProduction() {
        JwtTokenProvider provider = new JwtTokenProvider(revokedTokenRepository);
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("production");

        ReflectionTestUtils.setField(provider, "jwtSecret", JwtTokenProvider.DEFAULT_INSECURE_JWT_SECRET);
        ReflectionTestUtils.setField(provider, "env", prodEnv);

        IllegalStateException ex = assertThrows(IllegalStateException.class, provider::init);
        assertTrue(ex.getMessage().contains("Production application cannot run with default insecure JWT secret"));
    }

    @Test
    @DisplayName("VULN-03: Short JWT secret (<32 bytes) is rejected with IllegalStateException")
    void testShortJwtSecretRejected() {
        JwtTokenProvider provider = new JwtTokenProvider(revokedTokenRepository);
        ReflectionTestUtils.setField(provider, "jwtSecret", "TooShortKeyUnder32Bytes!");

        IllegalStateException ex = assertThrows(IllegalStateException.class, provider::init);
        assertTrue(ex.getMessage().contains("must be at least 256 bits"));
    }

    @Test
    @DisplayName("VULN-03: Production environment fails closed if default hardcoded AES key is configured")
    void testAesKeyFailsClosedInProduction() {
        AesEncryptionService aesService = new AesEncryptionService();
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("production");

        ReflectionTestUtils.setField(aesService, "configuredKey", AesEncryptionService.DEFAULT_INSECURE_AES_KEY);
        ReflectionTestUtils.setField(aesService, "env", prodEnv);

        IllegalStateException ex = assertThrows(IllegalStateException.class, aesService::init);
        assertTrue(ex.getMessage().contains("Production application cannot run with default insecure AES key"));
    }
}


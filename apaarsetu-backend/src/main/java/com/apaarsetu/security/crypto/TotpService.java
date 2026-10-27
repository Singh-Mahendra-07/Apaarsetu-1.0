package com.apaarsetu.security.crypto;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base32;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Optional;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: TotpService.java
 * Package: com.apaarsetu.security.crypto
 * Component: TotpService (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Implements RFC 6238 Time-Based One-Time Password (TOTP) algorithm for two-factor authentication.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Generates cryptographically random Base32 secret keys for user authenticator apps.
 * 2. Produces otpauth:// URIs compatible with Google Authenticator, Microsoft Authenticator, and Authy.
 * 3. Validates submitted 6-digit codes with time-window drift tolerance.
 * ============================================================================
 */
@Slf4j
@Service
public class TotpService {

    private static final String HMAC_ALGORITHM = "HmacSHA1";
    private static final int TIME_STEP_SECONDS = 30;
    private static final int CODE_DIGITS = 6;
    private static final int SECRET_BYTE_LENGTH = 20; // 160 bits (standard for SHA1 TOTP)
    private static final int WINDOW_STEPS = 1; // Allow +/- 1 window (30s drift)

    private final Base32 base32 = new Base32();
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateSecret() {
        byte[] buffer = new byte[SECRET_BYTE_LENGTH];
        secureRandom.nextBytes(buffer);
        return base32.encodeToString(buffer).replace("=", "");
    }

    public String buildQrCodeUri(String email, String secret) {
        String issuer = "APAARSetu";
        String encodedIssuer = URLEncoder.encode(issuer, StandardCharsets.UTF_8);
        String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8);
        return String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
                encodedIssuer, encodedEmail, secret, encodedIssuer);
    }

    public Optional<Long> verifyCode(String secret, String code, Long lastTotpTimeStep) {
        if (secret == null || code == null || code.trim().length() != CODE_DIGITS) {
            return Optional.empty();
        }
        long currentStep = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;

        for (int i = -WINDOW_STEPS; i <= WINDOW_STEPS; i++) {
            long step = currentStep + i;
            if (lastTotpTimeStep != null && step <= lastTotpTimeStep) {
                // Anti-replay: Reject steps already used
                continue;
            }
            String expectedCode = generateCodeForStep(secret, step);
            if (expectedCode.equals(code.trim())) {
                return Optional.of(step);
            }
        }
        return Optional.empty();
    }

    public String generateCodeForStep(String secret, long step) {
        try {
            byte[] keyBytes = base32.decode(secret);
            SecretKeySpec macKey = new SecretKeySpec(keyBytes, HMAC_ALGORITHM);
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(macKey);

            ByteBuffer buffer = ByteBuffer.allocate(8);
            buffer.putLong(step);
            byte[] hash = mac.doFinal(buffer.array());

            // Dynamic truncation RFC 4226
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);

            int otp = binary % 1_000_000;
            return String.format("%06d", otp);
        } catch (Exception e) {
            log.error("Failed to generate TOTP code: {}", e.getMessage());
            throw new RuntimeException("Error calculating TOTP code", e);
        }
    }
}

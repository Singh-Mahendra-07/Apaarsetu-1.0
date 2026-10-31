package com.apaarsetu.security.crypto;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: AesEncryptionService.java
 * Package: com.apaarsetu.security.crypto
 * Component: AesEncryptionService (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Provides AES-256-GCM symmetric cryptographic operations for encrypting sensitive PII at rest.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Uses Java Cryptography Architecture (JCA) with AES/GCM/NoPadding.
 * 2. Generates unique 12-byte initialization vectors (IV) for every encryption operation.
 * 3. Encrypts sensitive fields (Aadhaar, national IDs) before persistence and decrypts on authorized retrieval.
 * ============================================================================
 */
@Slf4j
@Service
public class AesEncryptionService {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12; // 96 bits for GCM
    private static final int TAG_LENGTH_BITS = 128;

    @Value("${app.security.aes-key:ApaarSetuMasterAesKey2026Secure!}")
    private String configuredKey;

    private SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final String ENCRYPTION_PREFIX = "enc:v1:";

    public static final String DEFAULT_INSECURE_AES_KEY = "ApaarSetuMasterAesKey2026Secure!";

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.core.env.Environment env;

    @PostConstruct
    public void init() {
        if (configuredKey == null || configuredKey.isBlank()) {
            throw new IllegalStateException("CRITICAL SECURITY ERROR: 'app.security.aes-key' must not be blank.");
        }
        if (DEFAULT_INSECURE_AES_KEY.equals(configuredKey)) {
            boolean isProd = false;
            if (env != null) {
                for (String profile : env.getActiveProfiles()) {
                    if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                        isProd = true;
                        break;
                    }
                }
            }
            if (isProd) {
                throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Production application cannot run with default insecure AES key. Define AES_KEY in environment.");
            }
            log.warn("SECURITY WARNING: Using default insecure AES key. This is prohibited in production!");
        }

        byte[] keyBytes;
        try {
            // Check if key is Base64 encoded
            byte[] decoded = Base64.getDecoder().decode(configuredKey);
            if (decoded.length == 32) {
                keyBytes = decoded;
            } else {
                keyBytes = derive32Bytes(configuredKey);
            }
        } catch (Exception e) {
            keyBytes = derive32Bytes(configuredKey);
        }
        this.secretKey = new SecretKeySpec(keyBytes, ALGORITHM);
        log.info("AES-256-GCM encryption service initialized with 256-bit key.");
    }

    private byte[] derive32Bytes(String raw) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            return md.digest(raw.getBytes(StandardCharsets.UTF_8));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available for key derivation", e);
        }
    }

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return plainText;
        }
        // If already encrypted, avoid double encryption
        if (plainText.startsWith(ENCRYPTION_PREFIX)) {
            return plainText;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return ENCRYPTION_PREFIX + Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            log.error("Failed to encrypt data with AES-256-GCM: {}", e.getMessage());
            throw new RuntimeException("Encryption error occurred", e);
        }
    }

    public String decrypt(String cipherText) {
        if (cipherText == null || cipherText.isBlank()) {
            return cipherText;
        }
        // Deterministic check: if not prefixed with enc:v1:, it is legacy plain text
        if (!cipherText.startsWith(ENCRYPTION_PREFIX)) {
            return cipherText;
        }

        String rawBase64 = cipherText.substring(ENCRYPTION_PREFIX.length());
        try {
            byte[] decoded = Base64.getDecoder().decode(rawBase64);
            if (decoded.length <= IV_LENGTH_BYTES) {
                return cipherText;
            }

            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[IV_LENGTH_BYTES];
            byteBuffer.get(iv);

            byte[] encryptedBytes = new byte[byteBuffer.remaining()];
            byteBuffer.get(encryptedBytes);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);

            byte[] plainTextBytes = cipher.doFinal(encryptedBytes);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Could not decrypt field: {}", e.getMessage());
            return cipherText;
        }
    }
}

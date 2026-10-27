package com.apaarsetu.security.jwt;

import com.apaarsetu.repository.RevokedTokenRepository;
import com.apaarsetu.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HexFormat;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: JwtTokenProvider.java
 * Package: com.apaarsetu.security.jwt
 * Component: JwtTokenProvider (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Handles cryptographic JWT creation, signing, claims extraction, and token validation.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Uses HMAC-SHA256 (HS256) with application secret key.
 * 2. Embeds user claims (userId, role, institutionId, unique tokenId) in payload.
 * 3. Validates token signature, expiration date, and format.
 * ============================================================================
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    @Value("${app.security.jwt-secret:ApaarSetuSecretKey2026MasterJwtTokenSignatureForNationalRegistryHS256SuperSecureProductionKey}")
    private String jwtSecret;

    @Value("${app.security.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs;

    @Value("${app.security.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    @Value("${app.security.mfa-challenge-expiration-ms:300000}")
    private long mfaChallengeExpirationMs;

    private final RevokedTokenRepository revokedTokenRepository;

    private SecretKey key;

    @PostConstruct
    public void init() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret key must be at least 256 bits (32 bytes) in length. Found " + keyBytes.length + " bytes.");
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .id(java.util.UUID.randomUUID().toString())
                .issuer("apaarsetu-registry")
                .audience().add("apaarsetu-client").and()
                .subject(principal.getId())
                .claim("email", principal.getEmail())
                .claim("fullName", principal.getFullName())
                .claim("role", principal.getRole())
                .claim("institutionId", principal.getInstitutionId())
                .claim("region", principal.getRegion())
                .claim("requiresPasswordChange", principal.isRequiresPasswordChange())
                .claim("tokenType", "ACCESS")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpirationMs);

        return Jwts.builder()
                .id(java.util.UUID.randomUUID().toString())
                .issuer("apaarsetu-registry")
                .audience().add("apaarsetu-client").and()
                .subject(principal.getId())
                .claim("email", principal.getEmail())
                .claim("tokenType", "REFRESH")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String generateMfaChallengeToken(String userId, String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + mfaChallengeExpirationMs);

        return Jwts.builder()
                .id(java.util.UUID.randomUUID().toString())
                .issuer("apaarsetu-registry")
                .audience().add("apaarsetu-client").and()
                .subject(userId)
                .claim("email", email)
                .claim("purpose", "MFA_CHALLENGE")
                .claim("tokenType", "CHALLENGE")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer("apaarsetu-registry")
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            if (claims.getExpiration().before(new Date())) {
                return false;
            }
            // Check if token is revoked
            String tokenHash = hashToken(token);
            if (revokedTokenRepository.existsByTokenHash(tokenHash)) {
                log.warn("Token was revoked: {}", tokenHash);
                return false;
            }
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }
}

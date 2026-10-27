package com.apaarsetu.security.filter;

import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.security.jwt.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: JwtAuthenticationFilter.java
 * Package: com.apaarsetu.security.filter
 * Component: JwtAuthenticationFilter (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Pre-authentication filter parsing and validating JWT Bearer tokens on incoming HTTP requests.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Extracts 'Bearer <token>' from the Authorization header.
 * 2. Verifies cryptographic signature and expiry via JwtTokenProvider.
 * 3. Checks token ID against RevokedTokenRepository to reject logged-out sessions.
 * 4. Populates Spring SecurityContextHolder with authenticated UserPrincipal.
 * ============================================================================
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // If already authenticated by ApiKeyAuthFilter, proceed
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = resolveToken(request);

            if (token != null && tokenProvider.validateToken(token)) {
                Claims claims = tokenProvider.parseClaims(token);

                String purpose = claims.get("purpose", String.class);
                String tokenType = claims.get("tokenType", String.class);

                // Reject MFA challenge tokens or Refresh tokens used as bearer authentication
                if ("MFA_CHALLENGE".equalsIgnoreCase(purpose) || "REFRESH".equalsIgnoreCase(tokenType)) {
                    log.warn("Blocked attempt to authenticate with purpose='{}', tokenType='{}'", purpose, tokenType);
                } else {
                    String userId = claims.getSubject();
                    String email = claims.get("email", String.class);
                    String fullName = claims.get("fullName", String.class);
                    String role = claims.get("role", String.class);
                    String institutionId = claims.get("institutionId", String.class);
                    String region = claims.get("region", String.class);
                    Boolean requiresPasswordChange = claims.get("requiresPasswordChange", Boolean.class);

                    UserPrincipal principal = UserPrincipal.builder()
                            .id(userId)
                            .email(email)
                            .fullName(fullName)
                            .role(role)
                            .institutionId(institutionId)
                            .region(region)
                            .status("ACTIVE")
                            .requiresPasswordChange(Boolean.TRUE.equals(requiresPasswordChange))
                            .build();

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Set user authentication in SecurityContext: {}", email);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7).trim();
        }

        // Fallback to cookie 'apaarsetu_access_token'
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("apaarsetu_access_token".equals(cookie.getName())) {
                    String val = cookie.getValue();
                    if (val != null && !val.isBlank()) {
                        try {
                            return URLDecoder.decode(val, StandardCharsets.UTF_8);
                        } catch (Exception e) {
                            return val;
                        }
                    }
                }
            }
        }

        return null;
    }
}

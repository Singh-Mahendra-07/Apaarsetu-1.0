package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.dto.*;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest httpRequest) {
        String clientIp = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        LoginResponse response = authService.login(request, clientIp, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", response));
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<ApiResponse<LoginResponse>> verifyMfa(@Valid @RequestBody MfaVerifyRequest request,
                                                               HttpServletRequest httpRequest) {
        String clientIp = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        LoginResponse response = authService.verifyMfa(request, clientIp, userAgent);
        return ResponseEntity.ok(ApiResponse.success("MFA authentication verified successfully", response));
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<ApiResponse<MfaSetupResponse>> setupMfa(@AuthenticationPrincipal UserPrincipal principal) {
        MfaSetupResponse response = authService.setupMfa(principal);
        return ResponseEntity.ok(ApiResponse.success("MFA setup initialized", response));
    }

    @PostMapping("/mfa/enable")
    public ResponseEntity<ApiResponse<String>> enableMfa(@AuthenticationPrincipal UserPrincipal principal,
                                                         @Valid @RequestBody MfaEnableRequest request) {
        String message = authService.enableMfa(principal, request);
        return ResponseEntity.ok(ApiResponse.success(message, message));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Access token refreshed", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletRequest request) {
        String token = extractToken(request);
        if (token != null && !token.isBlank()) {
            authService.logout(token);
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDTO>> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        UserProfileDTO profile = authService.getMe(principal);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PostMapping("/first-time-password")
    public ResponseEntity<ApiResponse<LoginResponse>> resetFirstTimePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody FirstTimePasswordResetRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String oldToken = extractToken(httpRequest);
        LoginResponse response = authService.resetFirstTimePassword(principal, request, oldToken, clientIp, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Password set successfully. Full platform access granted.", response));
    }

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("apaarsetu_access_token".equals(cookie.getName())) {
                    String val = cookie.getValue();
                    if (val != null && !val.isBlank()) {
                        try {
                            return java.net.URLDecoder.decode(val, java.nio.charset.StandardCharsets.UTF_8);
                        } catch (Exception e) {
                            return val;
                        }
                    }
                    break;
                }
            }
        }
        return null;
    }
}

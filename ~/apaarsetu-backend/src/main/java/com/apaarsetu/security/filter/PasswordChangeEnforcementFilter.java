package com.apaarsetu.security.filter;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.domain.User;
import com.apaarsetu.repository.UserRepository;
import com.apaarsetu.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * Spring Security Filter: Mandatory First-Time Password Reset Enforcement.
 * Blocks all backend API access (returning 403 Forbidden) for users with
 * requiresPasswordChange = true, explicitly permitting only the password resolution
 * request and essential session endpoints (logout, health, preflight).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PasswordChangeEnforcementFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private static final List<String> PERMITTED_PATH_SUFFIXES = List.of(
            "/auth/first-time-password",
            "/profile/password",
            "/auth/logout",
            "/auth/me",
            "/health",
            "/actuator/health"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Allow CORS preflight requests
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof UserPrincipal principal) {

            if (principal.isRequiresPasswordChange()) {
                String uri = request.getRequestURI();

                // Explicitly allow password submission and session cleanup endpoints
                boolean isPermitted = PERMITTED_PATH_SUFFIXES.stream().anyMatch(uri::endsWith);

                if (!isPermitted) {
                    log.warn("Blocked request to '{}' with restricted temporary token for user '{}' — mandatory password reset required",
                            uri, principal.getEmail());

                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                    ApiResponse<Object> error = ApiResponse.builder()
                            .success(false)
                            .message("Mandatory password reset required before accessing platform services.")
                            .errorCode("PASSWORD_CHANGE_REQUIRED")
                            .code("PASSWORD_CHANGE_REQUIRED")
                            .timestamp(Instant.now().toString())
                            .build();

                    objectMapper.writeValue(response.getOutputStream(), error);
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
